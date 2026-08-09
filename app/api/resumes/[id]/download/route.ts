import { auth } from "@clerk/nextjs/server";

import { getUserFileForUser } from "@/lib/db/files";
import { getResumeForUser } from "@/lib/db/resumes";
import { getR2Object } from "@/lib/r2";

export const runtime = "nodejs";

type ResumeDownloadRouteProps = {
	params: Promise<{ id: string }>;
};

export async function GET(req: Request, { params }: ResumeDownloadRouteProps) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await params;
	const resume = await getResumeForUser(id, userId);
	if (!resume) {
		return Response.json({ error: "Resume not found" }, { status: 404 });
	}

	if (resume.compileStatus !== "ready" || !resume.pdfFileId) {
		return Response.json(
			{
				error: "PDF not ready",
				compileStatus: resume.compileStatus,
				compileError: resume.compileError,
			},
			{ status: 409 },
		);
	}

	const file = await getUserFileForUser(resume.pdfFileId, userId);
	if (!file) {
		return Response.json({ error: "PDF file missing" }, { status: 404 });
	}

	const object = await getR2Object(file.key);
	const body = object.Body;
	if (!body) {
		return Response.json({ error: "PDF missing in storage" }, { status: 404 });
	}

	const bytes = await body.transformToByteArray();
	const asDownload = new URL(req.url).searchParams.get("download") === "1";
	const safeName = file.filename.replaceAll('"', "");

	return new Response(Buffer.from(bytes), {
		headers: {
			"Content-Type": "application/pdf",
			"Content-Length": String(file.size),
			"Content-Disposition": asDownload
				? `attachment; filename="${safeName}"`
				: `inline; filename="${safeName}"`,
			"Cache-Control": "private, max-age=60",
		},
	});
}
