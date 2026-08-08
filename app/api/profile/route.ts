import { auth } from "@clerk/nextjs/server";

import {
	getUserContext,
	updateUserContextProfile,
} from "@/lib/db/contexts";

export async function GET() {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const context = await getUserContext(userId);
	if (!context) {
		return Response.json({ error: "Profile not found" }, { status: 404 });
	}

	return Response.json({
		profile: context.profile,
		updatedAt: context.updatedAt,
	});
}

export async function PATCH(req: Request) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await req.json().catch(() => null);
	const profile =
		typeof body?.profile === "string" ? body.profile.trim() : "";

	if (!profile) {
		return Response.json(
			{ error: "Profile cannot be empty" },
			{ status: 400 },
		);
	}

	const existing = await getUserContext(userId);
	if (!existing) {
		return Response.json({ error: "Profile not found" }, { status: 404 });
	}

	const updated = await updateUserContextProfile(userId, profile);
	if (!updated) {
		return Response.json({ error: "Failed to update profile" }, { status: 500 });
	}

	return Response.json({
		profile: updated.profile,
		updatedAt: updated.updatedAt,
	});
}
