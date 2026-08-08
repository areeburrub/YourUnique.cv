import { auth } from "@clerk/nextjs/server";

import { upsertUserContext } from "@/lib/db/contexts";
import { getUserFilesByIds } from "@/lib/db/files";
import { MAX_UPLOAD_FILES } from "@/lib/uploads";

export async function POST(req: Request) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await req.json().catch(() => null);
	const profile =
		typeof body?.profile === "string" ? body.profile.trim() : "";
	const style = typeof body?.style === "string" ? body.style.trim() : "";
	const sourceFileIds = Array.isArray(body?.sourceFileIds)
		? body.sourceFileIds.filter(
				(id: unknown): id is string =>
					typeof id === "string" && id.trim().length > 0,
			)
		: [];

	if (!profile || !style) {
		return Response.json(
			{ error: "Profile and style are required" },
			{ status: 400 },
		);
	}

	if (
		sourceFileIds.length === 0 ||
		sourceFileIds.length > MAX_UPLOAD_FILES
	) {
		return Response.json(
			{
				error: `Provide between 1 and ${MAX_UPLOAD_FILES} source file ids`,
			},
			{ status: 400 },
		);
	}

	const owned = await getUserFilesByIds(sourceFileIds, userId);
	if (owned.length !== sourceFileIds.length) {
		return Response.json(
			{ error: "One or more files were not found" },
			{ status: 400 },
		);
	}

	await upsertUserContext({
		userId,
		profile,
		style,
		sourceFileIds,
	});

	return Response.json({ ok: true });
}
