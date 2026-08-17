import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getUserFileForUser } from "@/lib/db/files";
import {
	getResumeTemplateForUser,
	updateResumeTemplateForUser,
} from "@/lib/db/templates";
import {
	ensureCustomTemplateFromFile,
	triggerResumeTemplateJob,
} from "@/lib/resume-templates/ensure-from-file";
import { customRef } from "@/lib/resume-templates/refs";

export async function POST(req: Request) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const fileId =
		typeof (body as { fileId?: unknown })?.fileId === "string"
			? (body as { fileId: string }).fileId
			: "";
	const name =
		typeof (body as { name?: unknown })?.name === "string"
			? (body as { name: string }).name.trim()
			: "";
	const retryTemplateId =
		typeof (body as { templateId?: unknown })?.templateId === "string"
			? (body as { templateId: string }).templateId
			: "";

	if (retryTemplateId) {
		const existing = await getResumeTemplateForUser(retryTemplateId, userId);
		if (!existing) {
			return NextResponse.json(
				{ error: "Template not found" },
				{ status: 404 },
			);
		}
		if (!existing.sourceFileId) {
			return NextResponse.json(
				{ error: "Template is missing a source file" },
				{ status: 400 },
			);
		}
		const keepReady = existing.status === "ready" && Boolean(existing.html);
		if (!keepReady) {
			await updateResumeTemplateForUser(retryTemplateId, userId, {
				status: "drafting",
				error: null,
			});
		} else {
			await updateResumeTemplateForUser(retryTemplateId, userId, {
				error: null,
			});
		}
		try {
			const triggered = await triggerResumeTemplateJob({
				templateId: retryTemplateId,
				userId,
			});
			return NextResponse.json({
				ok: true,
				templateId: retryTemplateId,
				templateRef: customRef(retryTemplateId),
				runId: triggered.started ? triggered.runId : undefined,
				status: keepReady ? "ready" : "drafting",
			});
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to start template generation";
			if (!keepReady) {
				await updateResumeTemplateForUser(retryTemplateId, userId, {
					status: "failed",
					error: message.slice(0, 2000),
				});
			}
			return NextResponse.json({ error: message }, { status: 500 });
		}
	}

	if (!fileId) {
		return NextResponse.json(
			{ error: "fileId is required" },
			{ status: 400 },
		);
	}

	const file = await getUserFileForUser(fileId, userId);
	if (!file) {
		return NextResponse.json({ error: "File not found" }, { status: 404 });
	}

	const result = await ensureCustomTemplateFromFile({
		userId,
		fileId,
		name: name || undefined,
	});
	if (!result) {
		return NextResponse.json(
			{ error: "Upload a PDF or image of your resume format" },
			{ status: 400 },
		);
	}

	return NextResponse.json({
		ok: true,
		templateId: result.templateId,
		templateRef: result.templateRef,
		status: result.status,
	});
}
