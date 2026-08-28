import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "@/lib/db";
import {
	type CompileStatus,
	resumes,
} from "@/lib/db/schema";
import { touchUserActivity } from "@/lib/email/activity";
import { DEFAULT_TEMPLATE_REF } from "@/lib/resume-templates/types";

export type ResumeRow = typeof resumes.$inferSelect;

export type LatestResumeGroup = {
	latest: ResumeRow[];
	versionCountByFamily: Map<string, number>;
};

function latestPerFamily(rows: ResumeRow[]) {
	const latestByFamily = new Map<string, ResumeRow>();
	for (const row of rows) {
		const current = latestByFamily.get(row.familyId);
		if (!current || row.version > current.version) {
			latestByFamily.set(row.familyId, row);
		}
	}
	return [...latestByFamily.values()];
}

async function groupResumesByFamily(userId: string): Promise<LatestResumeGroup> {
	const rows = await db.query.resumes.findMany({
		where: eq(resumes.userId, userId),
		orderBy: [desc(resumes.createdAt)],
	});
	const versionCountByFamily = new Map<string, number>();
	for (const row of rows) {
		versionCountByFamily.set(
			row.familyId,
			(versionCountByFamily.get(row.familyId) ?? 0) + 1,
		);
	}
	const latest = latestPerFamily(rows).sort(
		(a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
	);
	return { latest, versionCountByFamily };
}

export async function userHasReadyResume(userId: string) {
	const row = await db.query.resumes.findFirst({
		where: and(eq(resumes.userId, userId), eq(resumes.compileStatus, "ready")),
		columns: { id: true },
	});
	return Boolean(row);
}

export async function listResumesForUser(userId: string) {
	const { latest } = await groupResumesByFamily(userId);
	return latest;
}

export async function listLatestResumesForUser(userId: string) {
	return groupResumesByFamily(userId);
}

export async function getResumeForUser(resumeId: string, userId: string) {
	return db.query.resumes.findFirst({
		where: and(eq(resumes.id, resumeId), eq(resumes.userId, userId)),
	});
}

export async function listResumeVersionsForUser(
	resumeId: string,
	userId: string,
) {
	const row = await getResumeForUser(resumeId, userId);
	if (!row) {
		return [];
	}
	return db.query.resumes.findMany({
		where: and(eq(resumes.userId, userId), eq(resumes.familyId, row.familyId)),
		orderBy: [desc(resumes.version)],
	});
}

export async function getLatestResumeInFamily(
	userId: string,
	familyId: string,
) {
	return db.query.resumes.findFirst({
		where: and(eq(resumes.userId, userId), eq(resumes.familyId, familyId)),
		orderBy: [desc(resumes.version)],
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
		orderBy: [desc(resumes.version), desc(resumes.updatedAt)],
	});
	return row ? getResumeDocument(row) : null;
}

export function resumeBelongsToThread(
	row: ResumeRow,
	threadId: string | null,
) {
	if (!threadId) {
		return false;
	}
	return row.threadId == null || row.threadId === threadId;
}

export async function listLatestResumesForThread(
	userId: string,
	threadId: string,
	templateRef?: string,
) {
	const rows = await db.query.resumes.findMany({
		where: templateRef
			? and(
					eq(resumes.userId, userId),
					eq(resumes.threadId, threadId),
					eq(resumes.templateRef, templateRef),
				)
			: and(eq(resumes.userId, userId), eq(resumes.threadId, threadId)),
		orderBy: [desc(resumes.createdAt)],
	});
	return latestPerFamily(rows);
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
	threadId?: string | null;
}) {
	const id = nanoid();
	const [row] = await db
		.insert(resumes)
		.values({
			id,
			familyId: id,
			version: 1,
			threadId: input.threadId ?? null,
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

	void touchUserActivity(input.userId);
	return row;
}

export async function createResumeVersion(input: {
	userId: string;
	fromResumeId: string;
	document: Record<string, unknown>;
	name?: string;
	jobDescription?: string | null;
	companyName?: string | null;
	roleTitle?: string | null;
	jobLink?: string | null;
	threadId?: string | null;
}) {
	const from = await getResumeForUser(input.fromResumeId, input.userId);
	if (!from) {
		return null;
	}

	const latest = await db.query.resumes.findFirst({
		where: and(
			eq(resumes.userId, input.userId),
			eq(resumes.familyId, from.familyId),
		),
		orderBy: [desc(resumes.version)],
	});

	const [row] = await db
		.insert(resumes)
		.values({
			id: nanoid(),
			familyId: from.familyId,
			version: (latest?.version ?? from.version) + 1,
			threadId: input.threadId ?? from.threadId,
			userId: input.userId,
			name: input.name ?? from.name,
			templateRef: from.templateRef,
			sourceJson: input.document,
			jobDescription:
				input.jobDescription !== undefined
					? input.jobDescription
					: from.jobDescription,
			companyName:
				input.companyName !== undefined
					? input.companyName?.trim() || null
					: from.companyName,
			roleTitle:
				input.roleTitle !== undefined
					? input.roleTitle?.trim() || null
					: from.roleTitle,
			jobLink:
				input.jobLink !== undefined
					? input.jobLink?.trim() || null
					: from.jobLink,
			compileStatus: "idle",
		})
		.returning();

	void touchUserActivity(input.userId);
	return row ?? null;
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
