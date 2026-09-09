import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { dismissRadarJobForUser } from "@/lib/db/radar";
import {
	applyDismissedJobFeedback,
	getRadarPreferences,
} from "@/lib/db/radar-preferences";
import { extractNegativeFeedback } from "@/lib/radar-negative-feedback";

const bodySchema = z.object({
	reason: z.string().trim().max(200).optional(),
});

export async function POST(
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
	const reason = parsed.success ? parsed.data.reason : undefined;

	const job = await dismissRadarJobForUser(userId, id, reason);
	if (!job) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	const preferences = await getRadarPreferences(userId);
	const extracted = await extractNegativeFeedback({
		job,
		existingAvoid: preferences?.negativePreferences ?? [],
	});

	const saved = await applyDismissedJobFeedback(userId, extracted);
	return NextResponse.json({
		ok: true,
		negativePreferences: saved.negativePreferences,
	});
}
