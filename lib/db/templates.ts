import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "@/lib/db";
import {
	type TemplateStatus,
	resumeTemplates,
} from "@/lib/db/schema";

export type ResumeTemplateRow = typeof resumeTemplates.$inferSelect;

export async function listResumeTemplatesForUser(userId: string) {
	return db.query.resumeTemplates.findMany({
		where: eq(resumeTemplates.userId, userId),
		orderBy: [desc(resumeTemplates.updatedAt)],
	});
}

export async function getResumeTemplateForUser(
	templateId: string,
	userId: string,
) {
	return db.query.resumeTemplates.findFirst({
		where: and(
			eq(resumeTemplates.id, templateId),
			eq(resumeTemplates.userId, userId),
		),
	});
}

export async function getResumeTemplateBySourceFileId(
	userId: string,
	sourceFileId: string,
) {
	return db.query.resumeTemplates.findFirst({
		where: and(
			eq(resumeTemplates.userId, userId),
			eq(resumeTemplates.sourceFileId, sourceFileId),
		),
		orderBy: [desc(resumeTemplates.updatedAt)],
	});
}

export async function createDraftResumeTemplate(input: {
	userId: string;
	name: string;
	sourceFileId: string;
	description?: string;
}) {
	const [row] = await db
		.insert(resumeTemplates)
		.values({
			id: nanoid(),
			userId: input.userId,
			name: input.name,
			description: input.description ?? "",
			sourceFileId: input.sourceFileId,
			status: "drafting",
		})
		.returning();
	return row;
}

export async function updateResumeTemplateForUser(
	templateId: string,
	userId: string,
	data: {
		name?: string;
		description?: string;
		inputSchema?: Record<string, unknown>;
		html?: string;
		notes?: string;
		previewFileId?: string | null;
		previewPdfFileId?: string | null;
		status?: TemplateStatus;
		error?: string | null;
	},
) {
	const patch: Record<string, unknown> = {
		updatedAt: new Date(),
	};
	if (data.name !== undefined) {
		patch.name = data.name;
	}
	if (data.description !== undefined) {
		patch.description = data.description;
	}
	if (data.inputSchema !== undefined) {
		patch.inputSchema = data.inputSchema;
	}
	if (data.html !== undefined) {
		patch.html = data.html;
	}
	if (data.notes !== undefined) {
		patch.notes = data.notes;
	}
	if (data.previewFileId !== undefined) {
		patch.previewFileId = data.previewFileId;
	}
	if (data.previewPdfFileId !== undefined) {
		patch.previewPdfFileId = data.previewPdfFileId;
	}
	if (data.status !== undefined) {
		patch.status = data.status;
	}
	if (data.error !== undefined) {
		patch.error = data.error;
	}

	const [row] = await db
		.update(resumeTemplates)
		.set(patch)
		.where(
			and(
				eq(resumeTemplates.id, templateId),
				eq(resumeTemplates.userId, userId),
			),
		)
		.returning();

	return row ?? null;
}
