import { auth } from "@clerk/nextjs/server";
import { after, NextResponse } from "next/server";

import { getUserPlanId, listRadarJobsForUser } from "@/lib/db/radar";
import { isPaidPlan } from "@/lib/plans";
import { ensureDailyRadarSearch } from "@/lib/radar-start";

export async function GET() {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const planId = await getUserPlanId(userId);
	if (isPaidPlan(planId)) {
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
	const data = await listRadarJobsForUser(userId, planId);
	return NextResponse.json(data);
}
