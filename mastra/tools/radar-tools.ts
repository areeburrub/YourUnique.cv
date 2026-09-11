import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import {
	getUserContext,
	updateUserContextProfile,
} from "@/lib/db/contexts";
import {
	getRadarJobForUser,
	getUserPlanId,
	queryRadarPoolForUser,
	setRadarJobsTrackerStatus,
	type RadarChatJob,
} from "@/lib/db/radar";
import {
	getRadarPreferences,
	patchRadarPreferences,
} from "@/lib/db/radar-preferences";
import { RADAR_WORKPLACE_TYPES } from "@/lib/db/schema";
import { isPaidPlan } from "@/lib/plans";
import { mergeJobSearchIntoProfile } from "@/lib/profile-job-search";

type ToolRequestContext = {
	get: (key: string) => unknown;
};

function requireUserId(requestContext: ToolRequestContext | undefined) {
	const userId = requestContext?.get("userId");
	if (typeof userId !== "string" || !userId) {
		throw new Error("Unauthorized");
	}
	return userId;
}

const RADAR_PRO_INSTRUCTION =
	"Job Radar is a Pro feature. The upgrade card is already shown in chat. Tell the user they need Pro to browse, filter, shortlist, or change Radar preferences. Do not invent jobs. Do not call other radar tools this turn.";

export const radarProToolResult = {
	ok: false as const,
	requiresPro: true,
	ui: "pro" as const,
	jobs: [] as RadarChatJob[],
	instruction: RADAR_PRO_INSTRUCTION,
};

const trackerFilterSchema = z
	.enum([
		"new",
		"saved",
		"applied",
		"interviewing",
		"offer",
		"rejected",
		"shortlisted",
	])
	.optional();

const workplaceSchema = z.enum(RADAR_WORKPLACE_TYPES);

async function requireRadarPro(userId: string) {
	const planId = await getUserPlanId(userId);
	if (!isPaidPlan(planId)) {
		return { ok: false as const, planId };
	}
	return { ok: true as const, planId };
}

async function syncJobSearchProfile(userId: string, notes?: string) {
	const [context, prefs] = await Promise.all([
		getUserContext(userId),
		getRadarPreferences(userId),
	]);
	if (!context) {
		return null;
	}
	const next = mergeJobSearchIntoProfile(context.profile, prefs, notes);
	if (next === context.profile) {
		return context.profile;
	}
	const updated = await updateUserContextProfile(userId, next);
	return updated?.profile ?? next;
}

export const listRadarJobsTool = createTool({
	id: "list_radar_jobs",
	description:
		"List and filter jobs already on this user's Job Radar (Postgres pool). Does not start a new search. Use for showing matches, shortlists, or filtered subsets. Returns a jobs card in chat.",
	inputSchema: z.object({
		query: z
			.string()
			.optional()
			.describe("Free-text match against title, company, location, summary"),
		trackerStatus: trackerFilterSchema.describe(
			"Tracker status. Use shortlisted or saved for the shortlist.",
		),
		workplace: z
			.string()
			.optional()
			.describe("Substring match on workplace, e.g. remote"),
		location: z.string().optional(),
		company: z.string().optional(),
		minScore: z.number().optional(),
		seniorityFit: z
			.enum(["match", "stretch", "too_junior", "too_senior", "unclear"])
			.optional(),
		limit: z.number().int().min(1).max(15).optional(),
	}),
	execute: async (input, context) => {
		const userId = requireUserId(context?.requestContext);
		const access = await requireRadarPro(userId);
		if (!access.ok) {
			return radarProToolResult;
		}

		const result = await queryRadarPoolForUser(userId, access.planId, {
			query: input.query,
			trackerStatus: input.trackerStatus,
			workplace: input.workplace,
			location: input.location,
			company: input.company,
			minScore: input.minScore,
			seniorityFit: input.seniorityFit,
			limit: input.limit,
		});

		if (!result.hasPool) {
			return {
				ok: true,
				requiresPro: false,
				ui: "open-radar" as const,
				jobs: [] as RadarChatJob[],
				total: 0,
				matched: 0,
				hasPool: false,
				instruction:
					"There are no jobs in their Radar pool yet. The Open Job Radar card is shown. Ask them to open Job Radar and run a search. Do not invent jobs.",
			};
		}

		return {
			ok: true,
			requiresPro: false,
			ui: result.jobs.length > 0 ? ("jobs" as const) : ("open-radar" as const),
			jobs: result.jobs,
			total: result.total,
			matched: result.matched,
			hasPool: true,
			instruction:
				result.jobs.length > 0
					? "A jobs card is shown in chat. Summarize in a sentence or two. Do not paste the full list as markdown. Offer to shortlist or tailor a CV."
					: "Nothing in the pool matched those filters. The Open Job Radar card is shown. Suggest opening Job Radar or loosening filters. Do not invent jobs.",
		};
	},
});

export const getRadarJobTool = createTool({
	id: "get_radar_job",
	description:
		"Read one job from the user's Radar pool, including a truncated description. Use when they ask about a specific match before tailoring.",
	inputSchema: z.object({
		jobId: z.string().min(1),
	}),
	execute: async (input, context) => {
		const userId = requireUserId(context?.requestContext);
		const access = await requireRadarPro(userId);
		if (!access.ok) {
			return radarProToolResult;
		}

		const job = await getRadarJobForUser(userId, input.jobId, access.planId);
		if (!job) {
			return {
				ok: false,
				requiresPro: false,
				ui: "open-radar" as const,
				jobs: [] as RadarChatJob[],
				instruction:
					"That job is not in their Radar pool. The Open Job Radar card is shown.",
			};
		}

		const description = job.description.trim().slice(0, 4000);
		return {
			ok: true,
			requiresPro: false,
			ui: "jobs" as const,
			jobs: [
				{
					id: job.id,
					title: job.title,
					company: job.company,
					location: job.location,
					workplace: job.workplace,
					url: job.url,
					atsScore: job.atsScore,
					verdict: job.verdict,
					summary: job.summary,
					trackerStatus: job.trackerStatus,
					seniorityFit: job.seniorityFit,
					postedAt: job.postedAt,
				},
			],
			job: {
				id: job.id,
				title: job.title,
				company: job.company,
				location: job.location,
				workplace: job.workplace,
				url: job.url,
				atsScore: job.atsScore,
				verdict: job.verdict,
				summary: job.summary,
				seniorityFit: job.seniorityFit,
				strengths: job.strengths,
				gaps: job.gaps,
				description,
			},
			instruction:
				"A job card is shown. Summarize fit in a few sentences. To tailor a CV, tell them to use Generate CV on the card or paste this posting — do not call create_resume yourself.",
		};
	},
});

export const getRadarPreferencesTool = createTool({
	id: "get_radar_preferences",
	description:
		"Read saved Job Radar search preferences (location, relocation, workplace types, extra notes).",
	inputSchema: z.object({}),
	execute: async (_input, context) => {
		const userId = requireUserId(context?.requestContext);
		const access = await requireRadarPro(userId);
		if (!access.ok) {
			return radarProToolResult;
		}

		const prefs = await getRadarPreferences(userId);
		return {
			ok: true,
			requiresPro: false,
			ui: null,
			jobs: [] as RadarChatJob[],
			preferences: prefs,
			instruction:
				"Use these preferences when filtering. If they want changes, call update_radar_preferences.",
		};
	},
});

export const updateRadarPreferencesTool = createTool({
	id: "update_radar_preferences",
	description:
		"Update Job Radar search preferences. Merges location, workplace, and avoid facts into the profile Job search section without replacing a longer section the profile agent wrote. Only pass fields that should change.",
	inputSchema: z.object({
		currentLocation: z.string().optional(),
		openToRelocation: z.boolean().optional(),
		workplaceTypes: z.array(workplaceSchema).optional(),
		extraPreferences: z
			.string()
			.optional()
			.describe("What they want: titles, seniority, industries, must-haves."),
		avoidNotes: z
			.array(z.string())
			.optional()
			.describe("Short avoid-rules to remember, e.g. no staff-plus, no crypto."),
	}),
	execute: async (input, context) => {
		const userId = requireUserId(context?.requestContext);
		const access = await requireRadarPro(userId);
		if (!access.ok) {
			return radarProToolResult;
		}

		const prefs = await patchRadarPreferences(userId, {
			currentLocation: input.currentLocation,
			openToRelocation: input.openToRelocation,
			workplaceTypes: input.workplaceTypes,
			extraPreferences: input.extraPreferences,
			avoidNotes: input.avoidNotes,
		});
		const profile = await syncJobSearchProfile(userId, input.extraPreferences);

		return {
			ok: true,
			requiresPro: false,
			ui: "open-radar" as const,
			jobs: [] as RadarChatJob[],
			preferences: prefs,
			profile,
			instruction:
				"Preferences are saved and the profile Job search section is updated. The Open Job Radar card is shown. Confirm what you saved in one or two sentences.",
		};
	},
});

export const shortlistRadarJobsTool = createTool({
	id: "shortlist_radar_jobs",
	description:
		"Mark one or more Radar jobs as saved/shortlisted in the user's pool.",
	inputSchema: z.object({
		jobIds: z.array(z.string().min(1)).min(1).max(15),
	}),
	execute: async (input, context) => {
		const userId = requireUserId(context?.requestContext);
		const access = await requireRadarPro(userId);
		if (!access.ok) {
			return radarProToolResult;
		}

		const updated = await setRadarJobsTrackerStatus(
			userId,
			input.jobIds,
			"saved",
		);
		const listed = await queryRadarPoolForUser(userId, access.planId, {
			trackerStatus: "saved",
			limit: 8,
		});

		return {
			ok: true,
			requiresPro: false,
			ui: listed.jobs.length > 0 ? ("jobs" as const) : ("open-radar" as const),
			jobs: listed.jobs,
			updated,
			instruction:
				updated.length > 0
					? "Those jobs are shortlisted. A jobs card is shown. Mention they can also review the board on Job Radar."
					: "None of those ids were in the pool. The Open Job Radar card is shown.",
		};
	},
});

export const openJobRadarTool = createTool({
	id: "open_job_radar",
	description:
		"Show a chat card that sends the user to the Job Radar page. Use after listing jobs, when the pool is empty, or when they should review the full board.",
	inputSchema: z.object({
		reason: z
			.string()
			.optional()
			.describe("Short reason shown on the card, e.g. Review your shortlist"),
	}),
	execute: async (input, context) => {
		requireUserId(context?.requestContext);
		return {
			ok: true,
			requiresPro: false,
			ui: "open-radar" as const,
			jobs: [] as RadarChatJob[],
			reason: input.reason?.trim() || "Review matches on Job Radar",
			instruction:
				"The Open Job Radar card is shown. Do not paste a raw /job-radar URL. Keep the reply to one short sentence.",
		};
	},
});
