import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getUserContext } from "@/lib/db/contexts";
import {
	analyzeNForPlan,
	createRadarMatchRun,
	getActiveRadarRun,
	getUserPlanId,
	hasActiveRadarRun,
	hasSuccessfulRadarRun,
	listExcludeRefs,
	markRadarRunFailed,
} from "@/lib/db/radar";
import { getRadarPreferences } from "@/lib/db/radar-preferences";
import { isPaidPlan } from "@/lib/plans";
import { startRadarMatchRun } from "@/lib/radar-client";
import { ensureDailyRadarSearch } from "@/lib/radar-start";

export async function POST() {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const context = await getUserContext(userId);
	const profile = context?.profile?.trim() ?? "";
	if (profile.length < 40) {
		return NextResponse.json(
			{ error: "Complete your career profile before searching jobs." },
			{ status: 400 },
		);
	}

	const preferences = await getRadarPreferences(userId);
	if (!preferences || !preferences.currentLocation) {
		return NextResponse.json(
			{
				error:
					"Set your job search preferences (location, remote/onsite, etc.) before searching.",
				needsPreferences: true,
			},
			{ status: 400 },
		);
	}
	const fullProfile = preferences.promptText
		? `${profile}\n\n${preferences.promptText}`
		: profile;

	const planId = await getUserPlanId(userId);
	const paid = isPaidPlan(planId);

	// Pro Enable Radar uses the same start as page load / upgrade / cron.
	// Never 409 just because they are paid — that form is the first search,
	// not a manual refresh.
	if (paid) {
		const result = await ensureDailyRadarSearch(userId);
		if (result.triggered) {
			try {
				await result.kickoff();
			} catch (error) {
				const message = error instanceof Error ? error.message : "radar failed";
				return NextResponse.json({ error: message }, { status: 502 });
			}
			return NextResponse.json({
				runId: result.runId,
				status: "running",
				etaMinutes: 8,
				analyzeN: analyzeNForPlan(planId),
			});
		}
		if (result.reason === "already_running") {
			const run = await getActiveRadarRun(userId);
			return NextResponse.json({
				runId: run?.id,
				status: "running",
				etaMinutes: 8,
				analyzeN: analyzeNForPlan(planId),
			});
		}
		if (result.reason === "no_preferences") {
			return NextResponse.json(
				{
					error:
						"Set your job search preferences (location, remote/onsite, etc.) before searching.",
					needsPreferences: true,
				},
				{ status: 400 },
			);
		}
		if (result.reason === "no_profile") {
			return NextResponse.json(
				{ error: "Complete your career profile before searching jobs." },
				{ status: 400 },
			);
		}
		return NextResponse.json({
			status: "idle",
			reason: result.reason,
		});
	}

	if (await hasActiveRadarRun(userId)) {
		return NextResponse.json(
			{ error: "A job search is already running." },
			{ status: 409 },
		);
	}

	if (await hasSuccessfulRadarRun(userId)) {
		return NextResponse.json(
			{
				error: "Free accounts get one Job Radar search. Upgrade to Pro for daily matches.",
			},
			{ status: 409 },
		);
	}

	const analyzeN = analyzeNForPlan(planId);
	const exclude = paid ? await listExcludeRefs(userId) : [];
	const runId = await createRadarMatchRun({
		userId,
		kind: "onboarding",
		analyzeN,
	});

	try {
		await startRadarMatchRun({
			runId,
			userId,
			profile: fullProfile,
			analyzeN,
			exclude,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "radar failed";
		await markRadarRunFailed(runId, message);
		return NextResponse.json({ error: message }, { status: 502 });
	}

	return NextResponse.json({
		runId,
		status: "running",
		etaMinutes: paid ? 8 : 3,
		analyzeN,
	});
}
