import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { setRadarJobTrackerStatus } from "@/lib/db/radar";
import { RADAR_TRACKER_STATUSES } from "@/lib/radar-tracker";

const bodySchema = z.object({
	status: z.enum(RADAR_TRACKER_STATUSES),
});

export async function PATCH(
	req: Request,
	ctx: { params: Promise<{ id: string }> },
) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await ctx.params;
	const json = await req.json().catch(() => ({}));
	const parsed = bodySchema.safeParse(json);
	if (!parsed.success) {
		return NextResponse.json({ error: "Invalid status" }, { status: 400 });
	}

	const updated = await setRadarJobTrackerStatus(
		userId,
		id,
		parsed.data.status,
	);
	if (!updated) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	return NextResponse.json(updated);
}
