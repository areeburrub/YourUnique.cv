import { and, desc, eq, gte, isNotNull, isNull, lte } from "drizzle-orm";

import { db } from "@/lib/db";
import { freeToolLeads, resumes, users } from "@/lib/db/schema";
import { QUIET_DRIP_ALIASES } from "@/lib/email/catalog";
import { dispatchTemplateEmail } from "@/lib/email/send";
import { checkoutPath, isPaidPlan, isTrialPlan } from "@/lib/plans";
import { isTrialActive, trialDaysRemaining } from "@/lib/trial";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const QUIET_IDLE_MS = 2 * DAY_MS;
const QUIET_STEP_MS = DAY_MS;
const QUIET_RECYCLE_MS = 30 * DAY_MS;
const FIRST_JOB_DELAY_MS = 16 * HOUR_MS;
const ONBOARDING_DELAY_MS = 2 * HOUR_MS;
const LEAD_DELAY_MS = HOUR_MS;

type UserRow = typeof users.$inferSelect;

function idleSince(user: UserRow, now: Date) {
	const mark = user.lastActivityAt ?? user.onboardedAt ?? user.createdAt;
	return now.getTime() - mark.getTime();
}

async function resumeMeta(userId: string) {
	const [latest, families] = await Promise.all([
		db.query.resumes.findFirst({
			where: eq(resumes.userId, userId),
			orderBy: [desc(resumes.createdAt)],
		}),
		db
			.selectDistinct({ familyId: resumes.familyId })
			.from(resumes)
			.where(eq(resumes.userId, userId)),
	]);
	return {
		resumeCount: families.length,
		companyName: latest?.companyName ?? null,
		roleTitle: latest?.roleTitle ?? null,
		resumeId: latest?.id ?? null,
	};
}

function leadScore(resultJson: Record<string, unknown> | null) {
	if (!resultJson) {
		return null;
	}
	if (typeof resultJson.score === "number") {
		return String(Math.round(resultJson.score));
	}
	if (typeof resultJson.match === "number") {
		return String(Math.round(resultJson.match));
	}
	const data = resultJson.data;
	if (data && typeof data === "object") {
		const record = data as Record<string, unknown>;
		if (typeof record.score === "number") {
			return String(Math.round(record.score));
		}
		if (typeof record.match === "number") {
			return String(Math.round(record.match));
		}
	}
	return null;
}

async function sendTrialEmails(now: Date) {
	const trialUsers = await db.query.users.findMany({
		where: and(eq(users.emailRemindersEnabled, true)),
	});
	let sent = 0;
	for (const user of trialUsers) {
		if (isPaidPlan(user.planId) || !isTrialPlan(user.planId) || !user.trialEndsAt) {
			continue;
		}
		const daysLeft = trialDaysRemaining(user.trialEndsAt, now);
		const active = isTrialActive(user.planId, user.trialEndsAt, now);
		if (!active && user.trialEndsAt.getTime() <= now.getTime()) {
			const result = await dispatchTemplateEmail({
				alias: "yucv-trial-ended",
				to: user.email,
				userId: user.id,
				ctaPath: checkoutPath(),
				ignoreMarketingCap: true,
			});
			if (result.ok) {
				await db
					.update(users)
					.set({
						quietDripStep: 11,
						quietDripLastCycleAt: now,
						updatedAt: now,
					})
					.where(eq(users.id, user.id));
				sent += 1;
			}
			continue;
		}
		if (!active) {
			continue;
		}
		if (daysLeft === 1) {
			const result = await dispatchTemplateEmail({
				alias: "yucv-trial-tomorrow",
				to: user.email,
				userId: user.id,
				ctaPath: checkoutPath(),
				ignoreMarketingCap: true,
			});
			if (result.ok) sent += 1;
			continue;
		}
		if (daysLeft === 2) {
			const result = await dispatchTemplateEmail({
				alias: "yucv-trial-2-days",
				to: user.email,
				userId: user.id,
				variables: { DAYS_LEFT: "2" },
				ctaPath: "/new-chat",
				ignoreMarketingCap: true,
			});
			if (result.ok) sent += 1;
		}
	}
	return sent;
}

async function sendQuietDrip(now: Date) {
	const candidates = await db.query.users.findMany({
		where: and(
			eq(users.emailRemindersEnabled, true),
			isNotNull(users.onboardedAt),
		),
	});
	let sent = 0;
	for (const user of candidates) {
		if (isTrialPlan(user.planId) && !isTrialActive(user.planId, user.trialEndsAt, now)) {
			continue;
		}
		const idle = idleSince(user, now);
		if (user.quietDripStep > 0 && user.quietDripStep < 11) {
			if (
				!user.quietDripLastSentAt ||
				now.getTime() - user.quietDripLastSentAt.getTime() < QUIET_STEP_MS
			) {
				continue;
			}
			const nextStep = user.quietDripStep + 1;
			if (nextStep > 10) {
				await db
					.update(users)
					.set({
						quietDripStep: 11,
						quietDripLastCycleAt: now,
						updatedAt: now,
					})
					.where(eq(users.id, user.id));
				continue;
			}
			const alias = QUIET_DRIP_ALIASES[nextStep - 1];
			const meta = await resumeMeta(user.id);
			const result = await dispatchTemplateEmail({
				alias,
				to: user.email,
				userId: user.id,
				dripCycle: user.quietDripStartedAt?.toISOString() ?? "quiet",
				variables: {
					COMPANY: meta.companyName ?? "that company",
					ROLE: meta.roleTitle ?? "the role",
					RESUME_COUNT: String(meta.resumeCount || "a few"),
				},
			});
			if (!result.ok) {
				continue;
			}
			await db
				.update(users)
				.set({
					quietDripStep: nextStep,
					quietDripLastSentAt: now,
					quietDripLastCycleAt: nextStep === 10 ? now : user.quietDripLastCycleAt,
					updatedAt: now,
				})
				.where(eq(users.id, user.id));
			sent += 1;
			continue;
		}

		if (idle < QUIET_IDLE_MS) {
			continue;
		}
		if (
			user.quietDripLastCycleAt &&
			now.getTime() - user.quietDripLastCycleAt.getTime() < QUIET_RECYCLE_MS
		) {
			continue;
		}
		const meta = await resumeMeta(user.id);
		const startedAt = now;
		const result = await dispatchTemplateEmail({
			alias: QUIET_DRIP_ALIASES[0],
			to: user.email,
			userId: user.id,
			dripCycle: startedAt.toISOString(),
			variables: {
				COMPANY: meta.companyName ?? "that company",
				ROLE: meta.roleTitle ?? "the role",
				RESUME_COUNT: String(meta.resumeCount || "a few"),
			},
		});
		if (!result.ok) {
			continue;
		}
		await db
			.update(users)
			.set({
				quietDripStep: 1,
				quietDripStartedAt: startedAt,
				quietDripLastSentAt: now,
				updatedAt: now,
			})
			.where(eq(users.id, user.id));
		sent += 1;
	}
	return sent;
}

async function sendFirstJobEmails(now: Date) {
	const onboarded = await db.query.users.findMany({
		where: and(
			eq(users.emailRemindersEnabled, true),
			isNotNull(users.onboardedAt),
			eq(users.quietDripStep, 0),
		),
	});
	let sent = 0;
	for (const user of onboarded) {
		if (!user.onboardedAt) continue;
		if (now.getTime() - user.onboardedAt.getTime() < FIRST_JOB_DELAY_MS) {
			continue;
		}
		if (idleSince(user, now) >= QUIET_IDLE_MS) {
			continue;
		}
		const meta = await resumeMeta(user.id);
		if (meta.resumeCount > 0) {
			continue;
		}
		const result = await dispatchTemplateEmail({
			alias: "yucv-first-job",
			to: user.email,
			userId: user.id,
		});
		if (result.ok) sent += 1;
	}
	return sent;
}

async function sendOnboardingStuck(now: Date) {
	const stuck = await db.query.users.findMany({
		where: and(eq(users.emailRemindersEnabled, true), isNull(users.onboardedAt)),
	});
	let sent = 0;
	for (const user of stuck) {
		if (now.getTime() - user.createdAt.getTime() < ONBOARDING_DELAY_MS) {
			continue;
		}
		const result = await dispatchTemplateEmail({
			alias: "yucv-onboarding-stuck",
			to: user.email,
			userId: user.id,
			ctaPath: "/onboarding",
		});
		if (result.ok) sent += 1;
	}
	return sent;
}

async function sendLeadFollowups(now: Date) {
	const since = new Date(now.getTime() - 6 * DAY_MS);
	const leads = await db.query.freeToolLeads.findMany({
		where: and(
			isNotNull(freeToolLeads.leadEmail),
			lte(freeToolLeads.createdAt, new Date(now.getTime() - LEAD_DELAY_MS)),
			gte(freeToolLeads.createdAt, since),
		),
	});
	let sent = 0;
	for (const lead of leads) {
		const email = lead.leadEmail?.trim().toLowerCase();
		if (!email) continue;
		const existingUser = await db.query.users.findFirst({
			where: eq(users.email, email),
		});
		if (existingUser) continue;
		const score = leadScore(lead.resultJson ?? null) ?? "your";
		const result = await dispatchTemplateEmail({
			alias: "yucv-lead-score",
			to: email,
			dripCycle: lead.id,
			variables: { SCORE: score, NAME: lead.leadName?.split(" ")[0] || "there" },
			ctaPath: `/sign-up?from=email-lead`,
		});
		if (result.ok) sent += 1;
	}
	return sent;
}

export async function runEmailAutomations(now = new Date()) {
	const trial = await sendTrialEmails(now);
	const quiet = await sendQuietDrip(now);
	const firstJob = await sendFirstJobEmails(now);
	const onboarding = await sendOnboardingStuck(now);
	const leads = await sendLeadFollowups(now);
	return { trial, quiet, firstJob, onboarding, leads };
}
