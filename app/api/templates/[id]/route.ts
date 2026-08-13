import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getUserFileForUser } from "@/lib/db/files";
import { getResumeTemplateForUser } from "@/lib/db/templates";
import { customRef } from "@/lib/resume-templates/refs";
import { fileAppUrl } from "@/lib/uploads";

export async function GET(
	_req: Request,
	context: { params: Promise<{ id: string }> },
) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await context.params;
	const row = await getResumeTemplateForUser(id, userId);
	if (!row) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	let previewUrl: string | null = null;
	if (row.previewFileId) {
		const file = await getUserFileForUser(row.previewFileId, userId);
		previewUrl = file ? fileAppUrl(file.id) : null;
	}

	let previewPdfUrl: string | null = null;
	if (row.previewPdfFileId) {
		const file = await getUserFileForUser(row.previewPdfFileId, userId);
		previewPdfUrl = file ? fileAppUrl(file.id) : null;
	}

	return NextResponse.json({
		ref: customRef(row.id),
		id: row.id,
		name: row.name,
		description: row.description,
		status: row.status,
		error: row.error,
		previewUrl,
		previewPdfUrl,
		updatedAt: row.updatedAt.toISOString(),
	});
}
