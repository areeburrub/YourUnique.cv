import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "@/lib/db";
import {
	type CompileStatus,
	resumes,
} from "@/lib/db/schema";
import {
	type ResumeDocument,
	parseResumeDocument,
} from "@/lib/resume-document";

export type ResumeRow = typeof resumes.$inferSelect;

export async function listResumesForUser(userId: string) {
	return db.query.resumes.findMany({
		where: eq(resumes.userId, userId),
		orderBy: [desc(resumes.updatedAt)],
	});
}

export async function getResumeForUser(resumeId: string, userId: string) {
	return db.query.resumes.findFirst({
		where: and(eq(resumes.id, resumeId), eq(resumes.userId, userId)),
	});
}

export function getResumeDocument(row: ResumeRow): ResumeDocument {
	return parseResumeDocument(row.sourceJson);
}

export async function createResume(input: {
	userId: string;
	name: string;
	document: ResumeDocument;
	jobDescription?: string | null;
}) {
	const document = parseResumeDocument(input.document);

	const [row] = await db
		.insert(resumes)
		.values({
			id: nanoid(),
			userId: input.userId,
			name: input.name,
			sourceJson: document,
			jobDescription: input.jobDescription ?? null,
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
		document?: ResumeDocument;
		jobDescription?: string | null;
		pdfFileId?: string | null;
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
	if (data.pdfFileId !== undefined) {
		patch.pdfFileId = data.pdfFileId;
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
	if (data.document !== undefined) {
		patch.sourceJson = parseResumeDocument(data.document);
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
	document: ResumeDocument,
) {
	return updateResumeForUser(resumeId, userId, {
		document,
		compileStatus: "idle",
		compileError: null,
	});
}
