import { and, desc, eq, gte, ne, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "@/lib/db";
import {
	type RadarAtsArea,
	type RadarAtsGap,
	type RadarAtsPayload,
	type RadarMatchRunKind,
	type RadarTrackerStatus,
	isRadarTrackerStatus,
	RADAR_TRACKER_STATUSES,
	radarJobs,
	radarMatchRuns,
	radarUserJobs,
	userContexts,
	users,
} from "@/lib/db/schema";
import { isPaidPlan } from "@/lib/plans";
import { parseRadarSeniorityFit } from "@/lib/radar-seniority";

/** Free list is 10 cards (5 blurred) — only ATS-score that shortlist. */
export const FREE_ANALYZE_N = 10;
export const PRO_ANALYZE_N = 40;
export const FREE_LIST_LIMIT = 10;
export const PRO_LIST_LIMIT = 50;
export const RADAR_LIST_PAGE_SIZE = 10;
export const FREE_BLUR_INDEXES = new Set([0, 1, 2, 5, 7]);

export function analyzeNForPlan(planId: string) {
	return isPaidPlan(planId) ? PRO_ANALYZE_N : FREE_ANALYZE_N;
}

export function listLimitForPlan(planId: string) {
	return isPaidPlan(planId) ? PRO_LIST_LIMIT : FREE_LIST_LIMIT;
}

/** Daily Pro cron and “today” checks use IST, same as `radar-daily-pro`. */
export const RADAR_DAY_TZ = "Asia/Kolkata";

export function radarTodayDateString(now = new Date()) {
	return now.toLocaleDateString("en-CA", { timeZone: RADAR_DAY_TZ });
}

export function radarTodayStart(now = new Date()) {
	return new Date(`${radarTodayDateString(now)}T00:00:00+05:30`);
}

export async function getUserPlanId(userId: string) {
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
		columns: { planId: true },
	});
	return user?.planId ?? "FREE";
}

export async function getLatestRadarRun(userId: string) {
	return db.query.radarMatchRuns.findFirst({
		where: eq(radarMatchRuns.userId, userId),
		orderBy: [desc(radarMatchRuns.createdAt)],
	});
}

export async function getActiveRadarRun(userId: string) {
	return db.query.radarMatchRuns.findFirst({
		where: and(
			eq(radarMatchRuns.userId, userId),
			sql`${radarMatchRuns.status} in ('queued', 'running')`,
		),
		orderBy: [desc(radarMatchRuns.createdAt)],
	});
}

export async function hasSuccessfulRadarRun(userId: string) {
	const row = await db.query.radarMatchRuns.findFirst({
		where: and(
			eq(radarMatchRuns.userId, userId),
			eq(radarMatchRuns.status, "ready"),
		),
		columns: { id: true },
	});
	return Boolean(row);
}

export async function hasActiveRadarRun(userId: string) {
	const row = await db.query.radarMatchRuns.findFirst({
		where: and(
			eq(radarMatchRuns.userId, userId),
			sql`${radarMatchRuns.status} in ('queued', 'running')`,
		),
		columns: { id: true },
	});
	return Boolean(row);
}

/** Below this many unread ("new") roles, Pro should search again even if it already ran today. */
export const MIN_UNREAD_RADAR_JOBS = 8;

export async function countUnreadRadarJobs(userId: string) {
	const [row] = await db
		.select({ count: sql<number>`count(*)` })
		.from(radarUserJobs)
		.where(
			and(
				eq(radarUserJobs.userId, userId),
				eq(radarUserJobs.hidden, false),
				eq(radarUserJobs.trackerStatus, "new"),
			),
		);
	return Number(row?.count ?? 0);
}

/** Jobs from today's batch the user dismissed or moved off "new". */
export async function countConsumedRadarJobs(userId: string) {
	const [row] = await db
		.select({ count: sql<number>`count(*)` })
		.from(radarUserJobs)
		.where(
			and(
				eq(radarUserJobs.userId, userId),
				eq(radarUserJobs.batchDate, radarTodayDateString()),
				or(
					eq(radarUserJobs.hidden, true),
					ne(radarUserJobs.trackerStatus, "new"),
				),
			),
		);
	return Number(row?.count ?? 0);
}

export async function hasPaidRadarRunToday(userId: string) {
	const row = await db.query.radarMatchRuns.findFirst({
		where: and(
			eq(radarMatchRuns.userId, userId),
			gte(radarMatchRuns.analyzeN, PRO_ANALYZE_N),
			gte(radarMatchRuns.createdAt, radarTodayStart()),
			sql`${radarMatchRuns.status} in ('queued', 'running', 'ready')`,
		),
		columns: { id: true },
	});
	return Boolean(row);
}

export async function listExcludeRefs(userId: string) {
	const rows = await db
		.select({
			source: radarJobs.source,
			externalId: radarJobs.externalId,
		})
		.from(radarUserJobs)
		.innerJoin(radarJobs, eq(radarUserJobs.jobId, radarJobs.id))
		.where(eq(radarUserJobs.userId, userId));
	return rows.map((r) => ({
		source: r.source,
		external_id: r.externalId,
	}));
}

export async function createRadarMatchRun(input: {
	userId: string;
	kind: RadarMatchRunKind;
	analyzeN: number;
}) {
	const id = nanoid();
	const now = new Date();
	await db.insert(radarMatchRuns).values({
		id,
		userId: input.userId,
		status: "running",
		kind: input.kind,
		analyzeN: input.analyzeN,
		startedAt: now,
		updatedAt: now,
	});
	return id;
}

export async function markRadarRunFailed(runId: string, error: string) {
	await db
		.update(radarMatchRuns)
		.set({
			status: "failed",
			error,
			finishedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(radarMatchRuns.id, runId));
}

export type RadarCallbackJob = {
	source: string;
	external_id: string;
	url: string;
	title: string;
	company: string;
	location?: string;
	workplace?: string;
	description?: string;
	posted_at?: string;
	rank: number;
	filter_score?: number;
	score: number;
	score_potential?: number;
	verdict?: string;
	summary?: string;
	exact_required?: number;
	total_required?: number;
	skills_in_skills?: number;
	required_skill_terms?: number;
	areas?: RadarAtsArea[];
	strengths?: string[];
	gaps?: RadarAtsGap[];
	seniority_fit?: string;
};

export async function applyRadarCallback(input: {
	runId: string;
	userId: string;
	status: string;
	error?: string;
	scanned?: number;
	analyzed?: number;
	summary?: string;
	jobs: RadarCallbackJob[];
}) {
	const run = await db.query.radarMatchRuns.findFirst({
		where: eq(radarMatchRuns.id, input.runId),
	});
	if (!run || run.userId !== input.userId) {
		throw new Error("run not found");
	}

	if (input.status === "failed") {
		await markRadarRunFailed(input.runId, input.error || "match failed");
		return { stored: 0 };
	}

	const batchDate = new Date().toISOString().slice(0, 10);
	let stored = 0;

	for (const job of input.jobs) {
		const existing = await db.query.radarJobs.findFirst({
			where: and(
				eq(radarJobs.source, job.source),
				eq(radarJobs.externalId, job.external_id),
			),
		});

		const seniorityFit = parseRadarSeniorityFit(job.seniority_fit);
		const atsPayload: RadarAtsPayload = {
			verdict: job.verdict,
			summary: job.summary,
			exactRequired: job.exact_required,
			totalRequired: job.total_required,
			skillsInSkills: job.skills_in_skills,
			requiredSkillTerms: job.required_skill_terms,
			areas: job.areas ?? [],
			strengths: job.strengths ?? [],
			gaps: job.gaps ?? [],
			filterScore: job.filter_score,
			scorePotential: job.score_potential,
			seniorityFit,
		};

		let jobId = existing?.id;
		if (existing) {
			await db
				.update(radarJobs)
				.set({
					url: job.url,
					title: job.title,
					company: job.company,
					location: job.location ?? "",
					workplace: job.workplace ?? "",
					description: job.description ?? existing.description,
					postedAt: job.posted_at ?? existing.postedAt,
					atsPayload,
					updatedAt: new Date(),
				})
				.where(eq(radarJobs.id, existing.id));
		} else {
			jobId = nanoid();
			await db.insert(radarJobs).values({
				id: jobId,
				source: job.source,
				externalId: job.external_id,
				url: job.url,
				title: job.title,
				company: job.company,
				location: job.location ?? "",
				workplace: job.workplace ?? "",
				description: job.description ?? "",
				postedAt: job.posted_at ?? null,
				atsPayload,
			});
		}

		if (!jobId) continue;

		const existingLink = await db.query.radarUserJobs.findFirst({
			where: and(
				eq(radarUserJobs.userId, input.userId),
				eq(radarUserJobs.jobId, jobId),
			),
		});

		if (existingLink) {
			await db
				.update(radarUserJobs)
				.set({
					runId: input.runId,
					rank: job.rank,
					atsScore: String(job.score),
					verdict: job.verdict ?? "",
					summary: job.summary ?? "",
					areas: job.areas ?? [],
					gaps: job.gaps ?? [],
					strengths: job.strengths ?? [],
					seniorityFit,
					batchDate,
				})
				.where(eq(radarUserJobs.id, existingLink.id));
		} else {
			await db.insert(radarUserJobs).values({
				id: nanoid(),
				userId: input.userId,
				jobId,
				runId: input.runId,
				rank: job.rank,
				atsScore: String(job.score),
				verdict: job.verdict ?? "",
				summary: job.summary ?? "",
				areas: job.areas ?? [],
				gaps: job.gaps ?? [],
				strengths: job.strengths ?? [],
				seniorityFit,
				batchDate,
			});
		}
		stored++;
	}

	await db
		.update(radarMatchRuns)
		.set({
			status: input.status === "ready" ? "ready" : "running",
			scanned: input.scanned ?? 0,
			analyzed: input.analyzed ?? stored,
			summary: input.summary ?? null,
			error: null,
			finishedAt: input.status === "ready" ? new Date() : null,
			updatedAt: new Date(),
		})
		.where(eq(radarMatchRuns.id, input.runId));

	return { stored };
}

export type RadarListJob = {
	id: string;
	rank: number;
	atsScore: number;
	verdict: string;
	summary: string;
	blurred: boolean;
	title: string | null;
	company: string | null;
	location: string | null;
	workplace: string | null;
	url: string | null;
	postedAt: string | null;
	batchDate: string;
	trackerStatus: RadarTrackerStatus;
	seniorityFit: string;
	strengths: string[];
	gaps: RadarAtsGap[];
	areas: RadarAtsArea[];
};

export async function listRadarJobsForUser(
	userId: string,
	planId: string,
	options?: { status?: RadarTrackerStatus; offset?: number; limit?: number },
) {
	const paid = isPaidPlan(planId);
	const planLimit = listLimitForPlan(planId);
	const offset = Math.max(0, options?.offset ?? 0);
	const pageSize = Math.min(
		planLimit,
		Math.max(1, options?.limit ?? planLimit),
	);
	const take = Math.min(pageSize, Math.max(0, planLimit - offset));
	const today = new Date().toISOString().slice(0, 10);
	const status = options?.status;
	const visibleToUser = and(
		eq(radarUserJobs.userId, userId),
		eq(radarUserJobs.hidden, false),
	);

	const jobsQuery = db
		.select({
			linkId: radarUserJobs.id,
			jobId: radarUserJobs.jobId,
			rank: radarUserJobs.rank,
			atsScore: radarUserJobs.atsScore,
			verdict: radarUserJobs.verdict,
			summary: radarUserJobs.summary,
			areas: radarUserJobs.areas,
			gaps: radarUserJobs.gaps,
			strengths: radarUserJobs.strengths,
			batchDate: radarUserJobs.batchDate,
			title: radarJobs.title,
			company: radarJobs.company,
			location: radarJobs.location,
			workplace: radarJobs.workplace,
			url: radarJobs.url,
			postedAt: radarJobs.postedAt,
			trackerStatus: radarUserJobs.trackerStatus,
			seniorityFit: radarUserJobs.seniorityFit,
		})
		.from(radarUserJobs)
		.innerJoin(radarJobs, eq(radarUserJobs.jobId, radarJobs.id))
		.where(
			and(
				visibleToUser,
				status ? eq(radarUserJobs.trackerStatus, status) : undefined,
			),
		)
		.orderBy(desc(radarUserJobs.atsScore), radarUserJobs.rank)
		.limit(take)
		.offset(offset);

	const [countRows, rows] = await Promise.all([
		db
			.select({
				status: radarUserJobs.trackerStatus,
				n: sql<number>`cast(count(*) as int)`,
			})
			.from(radarUserJobs)
			.where(visibleToUser)
			.groupBy(radarUserJobs.trackerStatus),
		take > 0 ? jobsQuery : Promise.resolve([]),
	]);

	const statusCounts = Object.fromEntries(
		RADAR_TRACKER_STATUSES.map((key) => [key, 0]),
	) as Record<RadarTrackerStatus, number>;
	let total = 0;
	for (const row of countRows) {
		const key = parseTrackerStatus(row.status);
		const n = Number(row.n) || 0;
		statusCounts[key] += n;
		total += n;
	}

	const jobs: RadarListJob[] = rows.map((row, index) => {
		const listIndex = offset + index;
		const blurred = !paid && FREE_BLUR_INDEXES.has(listIndex);
		return {
			id: blurred ? row.linkId : row.jobId,
			rank: listIndex + 1,
			atsScore: Number(row.atsScore),
			verdict: row.verdict,
			summary: blurred ? "" : row.summary,
			blurred,
			title: row.title,
			company: blurred ? null : row.company,
			location: blurred ? null : row.location,
			workplace: blurred ? null : row.workplace,
			url: blurred ? null : row.url,
			postedAt: blurred ? null : row.postedAt,
			batchDate: row.batchDate,
			trackerStatus: parseTrackerStatus(row.trackerStatus),
			seniorityFit: parseRadarSeniorityFit(row.seniorityFit),
			strengths: blurred ? [] : row.strengths,
			gaps: blurred ? [] : row.gaps,
			areas: blurred ? [] : row.areas,
		};
	});

	const matchedCount = status ? statusCounts[status] : total;
	const listedTotal = Math.min(planLimit, matchedCount);
	const listedN = Math.min(planLimit, total);
	const visible = paid
		? listedN
		: Array.from({ length: listedN }, (_, i) => i).filter(
				(index) => !FREE_BLUR_INDEXES.has(index),
			).length;

	const newToday = paid
		? jobs.filter((j) => j.batchDate === today)
		: [];
	const nextOffset = offset + jobs.length;
	const hasMore = nextOffset < listedTotal;
	const run =
		offset === 0
			? ((await getActiveRadarRun(userId)) ?? (await getLatestRadarRun(userId)))
			: null;

	return {
		jobs,
		total,
		visible,
		statusCounts,
		moreCount: Math.max(0, total - FREE_LIST_LIMIT),
		canRefresh: paid,
		isPaid: paid,
		newToday,
		nextOffset,
		listedTotal,
		hasMore,
		run,
	};
}

export async function getRadarJobForUser(userId: string, jobId: string, planId: string) {
	const paid = isPaidPlan(planId);
	const rows = await db
		.select({
			jobId: radarUserJobs.jobId,
			atsScore: radarUserJobs.atsScore,
			rank: radarUserJobs.rank,
			verdict: radarUserJobs.verdict,
			summary: radarUserJobs.summary,
			areas: radarUserJobs.areas,
			gaps: radarUserJobs.gaps,
			strengths: radarUserJobs.strengths,
			title: radarJobs.title,
			company: radarJobs.company,
			location: radarJobs.location,
			workplace: radarJobs.workplace,
			url: radarJobs.url,
			description: radarJobs.description,
			postedAt: radarJobs.postedAt,
			seniorityFit: radarUserJobs.seniorityFit,
			trackerStatus: radarUserJobs.trackerStatus,
		})
		.from(radarUserJobs)
		.innerJoin(radarJobs, eq(radarUserJobs.jobId, radarJobs.id))
		.where(
			and(eq(radarUserJobs.userId, userId), eq(radarUserJobs.hidden, false)),
		)
		.orderBy(desc(radarUserJobs.atsScore), radarUserJobs.rank);

	const index = rows.findIndex((r) => r.jobId === jobId);
	if (index < 0) {
		return null;
	}
	if (!paid && FREE_BLUR_INDEXES.has(index)) {
		return null;
	}
	if (!paid && index >= FREE_LIST_LIMIT) {
		return null;
	}
	const row = rows[index];
	return {
		id: row.jobId,
		rank: index + 1,
		atsScore: Number(row.atsScore),
		verdict: row.verdict,
		summary: row.summary,
		areas: row.areas,
		gaps: row.gaps,
		strengths: row.strengths,
		title: row.title,
		company: row.company,
		location: row.location,
		workplace: row.workplace,
		url: row.url,
		description: row.description,
		postedAt: row.postedAt,
		seniorityFit: parseRadarSeniorityFit(row.seniorityFit),
		trackerStatus: parseTrackerStatus(row.trackerStatus),
	};
}

export type DismissedRadarJob = {
	title: string;
	company: string;
	location: string;
	workplace: string;
	description: string;
	verdict: string;
	summary: string;
	strengths: string[];
	gaps: RadarAtsGap[];
};

/**
 * Marks a job hidden for this user (removed from their list, still kept in
 * `listExcludeRefs` via the underlying row so future match runs never
 * resurface it) and returns the job snapshot used to extract avoid-rules.
 */
export async function dismissRadarJobForUser(
	userId: string,
	jobId: string,
	reason?: string,
): Promise<DismissedRadarJob | null> {
	const row = await db.query.radarUserJobs.findFirst({
		where: and(
			eq(radarUserJobs.userId, userId),
			or(eq(radarUserJobs.jobId, jobId), eq(radarUserJobs.id, jobId)),
		),
	});
	if (!row) {
		return null;
	}
	const job = await db.query.radarJobs.findFirst({
		where: eq(radarJobs.id, row.jobId),
		columns: {
			title: true,
			company: true,
			location: true,
			workplace: true,
			description: true,
		},
	});

	await db
		.update(radarUserJobs)
		.set({ hidden: true, dismissedReason: reason ?? null })
		.where(eq(radarUserJobs.id, row.id));

	return {
		title: job?.title ?? "",
		company: job?.company ?? "",
		location: job?.location ?? "",
		workplace: job?.workplace ?? "",
		description: job?.description ?? "",
		verdict: row.verdict,
		summary: row.summary,
		strengths: row.strengths,
		gaps: row.gaps,
	};
}

function parseTrackerStatus(value: string | null | undefined): RadarTrackerStatus {
	if (value && isRadarTrackerStatus(value)) {
		return value;
	}
	return "new";
}

export async function setRadarJobTrackerStatus(
	userId: string,
	jobId: string,
	status: RadarTrackerStatus,
) {
	const row = await db.query.radarUserJobs.findFirst({
		where: and(
			eq(radarUserJobs.userId, userId),
			or(eq(radarUserJobs.jobId, jobId), eq(radarUserJobs.id, jobId)),
		),
	});
	if (!row || row.hidden) {
		return null;
	}

	await db
		.update(radarUserJobs)
		.set({ trackerStatus: status })
		.where(eq(radarUserJobs.id, row.id));

	return { id: row.jobId, trackerStatus: status };
}

export type RadarChatJob = {
	id: string;
	title: string;
	company: string;
	location: string;
	workplace: string;
	url: string;
	atsScore: number;
	verdict: string;
	summary: string;
	trackerStatus: RadarTrackerStatus;
	seniorityFit: string;
	postedAt: string | null;
};

export type RadarPoolFilter = {
	query?: string;
	trackerStatus?: RadarTrackerStatus | "shortlisted";
	workplace?: string;
	location?: string;
	company?: string;
	minScore?: number;
	seniorityFit?: string;
	limit?: number;
};

function haystack(job: RadarListJob) {
	return [
		job.title,
		job.company,
		job.location,
		job.workplace,
		job.summary,
		job.verdict,
	]
		.filter(Boolean)
		.join(" ")
		.toLowerCase();
}

export function toRadarChatJob(job: RadarListJob): RadarChatJob {
	return {
		id: job.id,
		title: job.title ?? "Matching role",
		company: job.company ?? "",
		location: job.location ?? "",
		workplace: job.workplace ?? "",
		url: job.url ?? "",
		atsScore: job.atsScore,
		verdict: job.verdict,
		summary: job.summary,
		trackerStatus: job.trackerStatus,
		seniorityFit: job.seniorityFit,
		postedAt: job.postedAt,
	};
}

export function filterRadarListJobs(
	jobs: RadarListJob[],
	filter: RadarPoolFilter = {},
): RadarChatJob[] {
	const query = filter.query?.trim().toLowerCase() ?? "";
	const workplace = filter.workplace?.trim().toLowerCase() ?? "";
	const location = filter.location?.trim().toLowerCase() ?? "";
	const company = filter.company?.trim().toLowerCase() ?? "";
	const seniority = filter.seniorityFit?.trim().toLowerCase() ?? "";
	const status =
		filter.trackerStatus === "shortlisted" ? "saved" : filter.trackerStatus;
	const minScore = filter.minScore;
	const limit = Math.min(Math.max(filter.limit ?? 8, 1), 15);

	const matched = jobs.filter((job) => {
		if (job.blurred) {
			return false;
		}
		if (status && job.trackerStatus !== status) {
			return false;
		}
		if (typeof minScore === "number" && job.atsScore < minScore) {
			return false;
		}
		if (workplace && !(job.workplace ?? "").toLowerCase().includes(workplace)) {
			return false;
		}
		if (location && !(job.location ?? "").toLowerCase().includes(location)) {
			return false;
		}
		if (company && !(job.company ?? "").toLowerCase().includes(company)) {
			return false;
		}
		if (seniority && job.seniorityFit !== seniority) {
			return false;
		}
		if (query && !haystack(job).includes(query)) {
			return false;
		}
		return true;
	});

	return matched.slice(0, limit).map(toRadarChatJob);
}

export async function queryRadarPoolForUser(
	userId: string,
	planId: string,
	filter: RadarPoolFilter = {},
) {
	const listed = await listRadarJobsForUser(userId, planId);
	const jobs = filterRadarListJobs(listed.jobs, filter);
	return {
		jobs,
		total: listed.total,
		matched: jobs.length,
		hasPool: listed.total > 0,
	};
}

export async function setRadarJobsTrackerStatus(
	userId: string,
	jobIds: string[],
	status: RadarTrackerStatus,
) {
	const updated: Array<{ id: string; trackerStatus: RadarTrackerStatus }> = [];
	for (const jobId of jobIds) {
		const row = await setRadarJobTrackerStatus(userId, jobId, status);
		if (row) {
			updated.push(row);
		}
	}
	return updated;
}

export async function listPaidUsersForDailyRadar() {
	const rows = await db
		.select({
			userId: users.id,
			planId: users.planId,
			email: users.email,
			profile: userContexts.profile,
		})
		.from(users)
		.innerJoin(userContexts, eq(userContexts.userId, users.id))
		.where(
			and(
				sql`${users.planId} in ('PRO', 'LIFETIME')`,
				sql`length(trim(${userContexts.profile})) > 40`,
			),
		);
	return rows;
}
