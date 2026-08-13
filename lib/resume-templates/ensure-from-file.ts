import { tasks } from "@trigger.dev/sdk";

import { getUserFileForUser } from "@/lib/db/files";
import {
	createDraftResumeTemplate,
	getResumeTemplateBySourceFileId,
	updateResumeTemplateForUser,
} from "@/lib/db/templates";
import { customRef } from "@/lib/resume-templates/refs";
import type { TemplateRef } from "@/lib/resume-templates/types";
import type { generateResumeTemplate } from "@/trigger/generate-resume-template";

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

	if (existing?.status === "ready" || existing?.status === "drafting") {
		return {
			templateId: existing.id,
			templateRef: customRef(existing.id),
			status: existing.status,
			started: false,
		};
	}

	let templateId = existing?.id;
	if (existing?.status === "failed") {
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
		await tasks.trigger<typeof generateResumeTemplate>(
			"generate-resume-template",
			{
				templateId,
				userId: input.userId,
			},
		);
		return {
			templateId,
			templateRef: customRef(templateId),
			status: "drafting",
			started: true,
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
