import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "@/lib/db";
import {
	type CompileStatus,
	resumes,
} from "@/lib/db/schema";
import { DEFAULT_TEMPLATE_REF } from "@/lib/resume-templates/types";

export type ResumeRow = typeof resumes.$inferSelect;

export async function listResumesForUser(userId: string) {
	return db.query.resumes.findMany({
		where: eq(resumes.userId, userId),
		orderBy: [desc(resumes.createdAt)],
	});
}

export async function getResumeForUser(resumeId: string, userId: string) {
	return db.query.resumes.findFirst({
		where: and(eq(resumes.id, resumeId), eq(resumes.userId, userId)),
	});
}

export function getResumeDocument(row: ResumeRow): Record<string, unknown> {
	return (row.sourceJson ?? {}) as Record<string, unknown>;
}

export async function getLatestResumeDocumentForTemplateRef(
	userId: string,
	templateRef: string,
): Promise<Record<string, unknown> | null> {
	const row = await db.query.resumes.findFirst({
		where: and(eq(resumes.userId, userId), eq(resumes.templateRef, templateRef)),
		orderBy: [desc(resumes.updatedAt)],
	});
	return row ? getResumeDocument(row) : null;
}

export async function listResumesForUserByTemplateRef(
	userId: string,
	templateRef: string,
) {
	return db.query.resumes.findMany({
		where: and(eq(resumes.userId, userId), eq(resumes.templateRef, templateRef)),
		orderBy: [desc(resumes.updatedAt)],
	});
}

export async function createResume(input: {
	userId: string;
	name: string;
	document: Record<string, unknown>;
	templateRef: string;
	jobDescription?: string | null;
	companyName?: string | null;
	roleTitle?: string | null;
	jobLink?: string | null;
}) {
	const [row] = await db
		.insert(resumes)
		.values({
			id: nanoid(),
			userId: input.userId,
			name: input.name,
			templateRef: input.templateRef || DEFAULT_TEMPLATE_REF,
			sourceJson: input.document,
			jobDescription: input.jobDescription ?? null,
			companyName: input.companyName?.trim() || null,
			roleTitle: input.roleTitle?.trim() || null,
			jobLink: input.jobLink?.trim() || null,
			compileStatus: "idle",
		})
		.returning();

	return row;
}

export async function updateResumeForUser(
	resumeId: string,
	userId: string,
	data: {
		name?: string;
		document?: Record<string, unknown>;
		templateRef?: string;
		jobDescription?: string | null;
		companyName?: string | null;
		roleTitle?: string | null;
		jobLink?: string | null;
		pdfFileId?: string | null;
		previewFileId?: string | null;
		compileStatus?: CompileStatus;
		compileError?: string | null;
		compiledAt?: Date | null;
	},
) {
	const patch: Record<string, unknown> = {
		updatedAt: new Date(),
	};

	if (data.name !== undefined) {
		patch.name = data.name;
	}
	if (data.jobDescription !== undefined) {
		patch.jobDescription = data.jobDescription;
	}
	if (data.companyName !== undefined) {
		patch.companyName = data.companyName?.trim() || null;
	}
	if (data.roleTitle !== undefined) {
		patch.roleTitle = data.roleTitle?.trim() || null;
	}
	if (data.jobLink !== undefined) {
		patch.jobLink = data.jobLink?.trim() || null;
	}
	if (data.pdfFileId !== undefined) {
		patch.pdfFileId = data.pdfFileId;
	}
	if (data.previewFileId !== undefined) {
		patch.previewFileId = data.previewFileId;
	}
	if (data.compileStatus !== undefined) {
		patch.compileStatus = data.compileStatus;
	}
	if (data.compileError !== undefined) {
		patch.compileError = data.compileError;
	}
	if (data.compiledAt !== undefined) {
		patch.compiledAt = data.compiledAt;
	}
	if (data.templateRef !== undefined) {
		patch.templateRef = data.templateRef;
	}
	if (data.document !== undefined) {
		patch.sourceJson = data.document;
	}

	const [row] = await db
		.update(resumes)
		.set(patch)
		.where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)))
		.returning();

	return row ?? null;
}

export async function replaceResumeDocument(
	resumeId: string,
	userId: string,
	document: Record<string, unknown>,
) {
	return updateResumeForUser(resumeId, userId, {
		document,
		compileStatus: "idle",
		compileError: null,
	});
}
