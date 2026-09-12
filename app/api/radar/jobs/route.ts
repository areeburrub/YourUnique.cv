import { auth } from "@clerk/nextjs/server";
import { after, NextResponse } from "next/server";

import {
	getUserPlanId,
	listLimitForPlan,
	listRadarJobsForUser,
	RADAR_LIST_PAGE_SIZE,
} from "@/lib/db/radar";
import { isPaidPlan } from "@/lib/plans";
import { isRadarTrackerStatus } from "@/lib/radar-tracker";
import { ensureDailyRadarSearch } from "@/lib/radar-start";

function parseNonNegInt(value: string | null, fallback: number) {
	if (value == null || value === "") {
		return fallback;
	}
	const n = Number.parseInt(value, 10);
	return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export async function GET(req: Request) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const url = new URL(req.url);
	const statusParam = url.searchParams.get("status");
	const status =
		statusParam && isRadarTrackerStatus(statusParam) ? statusParam : undefined;
	const offset = parseNonNegInt(url.searchParams.get("offset"), 0);

	const planId = await getUserPlanId(userId);
	const planLimit = listLimitForPlan(planId);
	const limit = Math.min(
		planLimit,
		Math.max(1, parseNonNegInt(url.searchParams.get("limit"), RADAR_LIST_PAGE_SIZE)),
	);

	if (offset === 0 && isPaidPlan(planId)) {
		try {
			const result = await ensureDailyRadarSearch(userId);
			if (result.triggered) {
				after(() =>
					result.kickoff().catch((error) => {
						console.error("Radar start on jobs list failed", error);
					}),
				);
			}
		} catch (error) {
			console.error("Radar start on jobs list failed", error);
		}
	}
	const data = await listRadarJobsForUser(userId, planId, {
		offset,
		limit,
		...(status ? { status } : {}),
	});
	return NextResponse.json(data);
}
