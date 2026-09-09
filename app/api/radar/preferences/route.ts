import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
	getRadarPreferences,
	saveRadarPreferences,
} from "@/lib/db/radar-preferences";
import { RADAR_WORKPLACE_TYPES } from "@/lib/db/schema";

export async function GET() {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	const preferences = await getRadarPreferences(userId);
	return NextResponse.json({ preferences });
}

const bodySchema = z.object({
	currentLocation: z.string().trim().max(200).default(""),
	openToRelocation: z.boolean().default(false),
	preferredLocations: z.array(z.string().trim().max(200)).max(10).default([]),
	relocationRadiusKm: z
		.number()
		.int()
		.min(0)
		.max(20000)
		.nullable()
		.default(null),
	workplaceTypes: z
		.array(z.enum(RADAR_WORKPLACE_TYPES))
		.max(RADAR_WORKPLACE_TYPES.length)
		.default([]),
	extraPreferences: z.string().trim().max(2000).default(""),
});

export async function POST(req: Request) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const json = await req.json().catch(() => null);
	const parsed = bodySchema.safeParse(json);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: parsed.error.issues[0]?.message ?? "Invalid preferences" },
			{ status: 400 },
		);
	}

	const promptText = await saveRadarPreferences(userId, parsed.data);
	return NextResponse.json({ ok: true, promptText });
}
