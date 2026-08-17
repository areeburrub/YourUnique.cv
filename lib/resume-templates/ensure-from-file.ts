import { idempotencyKeys, runs, tasks } from "@trigger.dev/sdk";

import { getUserFileForUser } from "@/lib/db/files";
import {
	createDraftResumeTemplate,
	getResumeTemplateBySourceFileId,
	updateResumeTemplateForUser,
} from "@/lib/db/templates";
import { customRef } from "@/lib/resume-templates/refs";
import type { TemplateRef } from "@/lib/resume-templates/types";
import type { generateResumeTemplate } from "@/trigger/generate-resume-template";

const ACTIVE_RUN_STATUSES = [
	"PENDING_VERSION",
	"QUEUED",
	"DEQUEUED",
	"EXECUTING",
	"WAITING",
	"DELAYED",
] as const;

function templateRunTag(templateId: string) {
	return `template:${templateId}`;
}

async function hasActiveTemplateRun(templateId: string) {
	try {
		const page = await runs.list({
			taskIdentifier: "generate-resume-template",
			tag: templateRunTag(templateId),
			status: [...ACTIVE_RUN_STATUSES],
			limit: 1,
		});
		return page.data.length > 0;
	} catch {
		return false;
	}
}

export async function triggerResumeTemplateJob(input: {
	templateId: string;
	userId: string;
}) {
	if (await hasActiveTemplateRun(input.templateId)) {
		return { started: false as const };
	}

	const idempotencyKey = await idempotencyKeys.create(
		`generate-resume-template:${input.templateId}`,
		{ scope: "global" },
	);
	const handle = await tasks.trigger<typeof generateResumeTemplate>(
		"generate-resume-template",
		{
			templateId: input.templateId,
			userId: input.userId,
		},
		{
			tags: [templateRunTag(input.templateId)],
			idempotencyKey,
			idempotencyKeyTTL: "10m",
		},
	);

	return { started: true as const, runId: handle.id };
}

function isTemplateSourceMediaType(contentType: string) {
	return (
		contentType.startsWith("image/") || contentType === "application/pdf"
	);
}

export async function ensureCustomTemplateFromFile(input: {
	userId: string;
	fileId: string;
	name?: string;
}): Promise<{
	templateId: string;
	templateRef: TemplateRef;
	status: "drafting" | "ready" | "failed";
	started: boolean;
} | null> {
	const file = await getUserFileForUser(input.fileId, input.userId);
	if (!file || !isTemplateSourceMediaType(file.contentType)) {
		return null;
	}

	const existing = await getResumeTemplateBySourceFileId(
		input.userId,
		input.fileId,
	);

	if (existing?.status === "ready") {
		return {
			templateId: existing.id,
			templateRef: customRef(existing.id),
			status: existing.status,
			started: false,
		};
	}

	let templateId = existing?.id;
	if (existing) {
		await updateResumeTemplateForUser(existing.id, input.userId, {
			status: "drafting",
			error: null,
			name: input.name || existing.name || "Your resume",
		});
		templateId = existing.id;
	} else {
		const draft = await createDraftResumeTemplate({
			userId: input.userId,
			name: input.name || "Your resume",
			sourceFileId: file.id,
			description: "Generated from your uploaded resume",
		});
		templateId = draft.id;
	}

	try {
		const triggered = await triggerResumeTemplateJob({
			templateId,
			userId: input.userId,
		});
		return {
			templateId,
			templateRef: customRef(templateId),
			status: "drafting",
			started: triggered.started,
		};
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: "Failed to start template generation";
		await updateResumeTemplateForUser(templateId, input.userId, {
			status: "failed",
			error: message.slice(0, 2000),
		});
		return {
			templateId,
			templateRef: customRef(templateId),
			status: "failed",
			started: false,
		};
	}
}
