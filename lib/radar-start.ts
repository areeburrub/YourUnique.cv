import { getUserContext } from "@/lib/db/contexts";
import {
	countConsumedRadarJobs,
	countUnreadRadarJobs,
	createRadarMatchRun,
	getUserPlanId,
	hasActiveRadarRun,
	hasPaidRadarRunToday,
	listExcludeRefs,
	markRadarRunFailed,
	MIN_UNREAD_RADAR_JOBS,
	PRO_ANALYZE_N,
} from "@/lib/db/radar";
import { getRadarPreferences } from "@/lib/db/radar-preferences";
import type { RadarMatchRunKind } from "@/lib/db/schema";
import { isPaidPlan } from "@/lib/plans";
import { startRadarMatchRun } from "@/lib/radar-client";

export type PaidRadarStartResult =
	| { skipped: true; reason: string }
	| { skipped: false; runId: string; status: "running" };

type PreparedPaidRadarMatch =
	| { skipped: true; reason: string }
	| { skipped: false; runId: string; start: () => Promise<void> };

/**
 * Inserts a running match row and returns a kickoff function that talks to
 * Go. Callers that must not block on Go (the jobs list) create the row, then
 * run `start` after the response. Everyone else awaits `start`.
 */
async function preparePaidRadarMatch(
	userId: string,
	kind: RadarMatchRunKind = "daily",
): Promise<PreparedPaidRadarMatch> {
	if (await hasActiveRadarRun(userId)) {
		return { skipped: true, reason: "already_running" };
	}

	const context = await getUserContext(userId);
	const profile = context?.profile?.trim() ?? "";
	if (profile.length < 40) {
		return { skipped: true, reason: "no_profile" };
	}

	const exclude = await listExcludeRefs(userId);
	const preferences = await getRadarPreferences(userId);
	const fullProfile = preferences?.promptText
		? `${profile}\n\n${preferences.promptText}`
		: profile;
	const runId = await createRadarMatchRun({
		userId,
		kind,
		analyzeN: PRO_ANALYZE_N,
	});

	return {
		skipped: false,
		runId,
		start: async () => {
			try {
				await startRadarMatchRun({
					runId,
					userId,
					profile: fullProfile,
					analyzeN: PRO_ANALYZE_N,
					exclude,
				});
			} catch (error) {
				const message = error instanceof Error ? error.message : "radar failed";
				await markRadarRunFailed(runId, message);
				throw error;
			}
		},
	};
}

/**
 * Starts a Pro match run against the Go radar. Used by the Trigger.dev
 * `radar-match-user` ops task. HTTP/cron callers should use
 * `ensureDailyRadarSearch` so "should we search?" stays in one place.
 */
export async function startPaidRadarMatch(
	userId: string,
	kind: RadarMatchRunKind = "daily",
): Promise<PaidRadarStartResult> {
	const prepared = await preparePaidRadarMatch(userId, kind);
	if (prepared.skipped) {
		return prepared;
	}
	await prepared.start();
	return { skipped: false, runId: prepared.runId, status: "running" };
}

export type RadarSearchDecision =
	| { trigger: true; reason: "low_unread" | "no_run_today" }
	| { trigger: false; reason: string };

/**
 * The single source of truth for "does this Pro user need a search right
 * now?". Used identically by the jobs-list page load, Enable Radar, the
 * post-upgrade webhook, and the daily cron.
 */
export async function decideRadarSearch(
	userId: string,
): Promise<RadarSearchDecision> {
	const planId = await getUserPlanId(userId);
	if (!isPaidPlan(planId)) {
		return { trigger: false, reason: "not_paid" };
	}
	if (await hasActiveRadarRun(userId)) {
		return { trigger: false, reason: "already_running" };
	}
	const context = await getUserContext(userId);
	if ((context?.profile?.trim().length ?? 0) < 40) {
		return { trigger: false, reason: "no_profile" };
	}
	const preferences = await getRadarPreferences(userId);
	if (!preferences?.currentLocation) {
		return { trigger: false, reason: "no_preferences" };
	}

	const ranToday = await hasPaidRadarRunToday(userId);
	if (!ranToday) {
		return { trigger: true, reason: "no_run_today" };
	}

	const unread = await countUnreadRadarJobs(userId);
	if (unread >= MIN_UNREAD_RADAR_JOBS) {
		return { trigger: false, reason: "has_enough_and_ran_today" };
	}

	// Already ran today with a thin shortlist. Only search again if the user
	// actually consumed matches (dismissed or moved off "new"). Otherwise
	// GET /jobs (and its 8s poll) would immediately start another run.
	const consumed = await countConsumedRadarJobs(userId);
	if (consumed > 0) {
		return { trigger: true, reason: "low_unread" };
	}
	return { trigger: false, reason: "thin_results_today" };
}

export type EnsureRadarSearchResult =
	| { triggered: false; reason: string }
	| {
			triggered: true;
			reason: string;
			runId: string;
			kickoff: () => Promise<void>;
	  };

/**
 * Evaluates `decideRadarSearch` and, if it should go, inserts a running
 * row. The caller must invoke `kickoff()` to talk to Go — await it on
 * Enable Radar / cron / upgrade, or schedule it with `after()` on GET
 * /jobs so the list is not blocked on the Go HTTP start.
 */
export async function ensureDailyRadarSearch(
	userId: string,
): Promise<EnsureRadarSearchResult> {
	const decision = await decideRadarSearch(userId);
	if (!decision.trigger) {
		return { triggered: false, reason: decision.reason };
	}
	const prepared = await preparePaidRadarMatch(userId, "daily");
	if (prepared.skipped) {
		return { triggered: false, reason: prepared.reason };
	}
	return {
		triggered: true,
		reason: decision.reason,
		runId: prepared.runId,
		kickoff: prepared.start,
	};
}
