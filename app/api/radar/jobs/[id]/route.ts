import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
	getRadarJobForUser,
	getUserPlanId,
} from "@/lib/db/radar";

export async function GET(
	_req: Request,
	ctx: { params: Promise<{ id: string }> },
) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await ctx.params;
	const planId = await getUserPlanId(userId);
	const job = await getRadarJobForUser(userId, id, planId);
	if (!job) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}
	return NextResponse.json({ job });
}
