import { auth } from "@clerk/nextjs/server";

import { getUserFileForUser } from "@/lib/db/files";
import { getR2Object } from "@/lib/r2";

export const runtime = "nodejs";

type FileRouteProps = {
	params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: FileRouteProps) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await params;
	const file = await getUserFileForUser(id, userId);
	if (!file) {
		return Response.json({ error: "File not found" }, { status: 404 });
	}

	const object = await getR2Object(file.key);
	const body = object.Body;
	if (!body) {
		return Response.json({ error: "File missing" }, { status: 404 });
	}

	const bytes = await body.transformToByteArray();

	return new Response(Buffer.from(bytes), {
		headers: {
			"Content-Type": file.contentType,
			"Content-Length": String(file.size),
			"Content-Disposition": `inline; filename="${file.filename.replaceAll('"', "")}"`,
			"Cache-Control": "private, max-age=3600",
		},
	});
}
