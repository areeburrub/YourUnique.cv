import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "@/lib/db";
import {
	type CompileStatus,
	resumes,
} from "@/lib/db/schema";

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

export async function createResume(input: {
	userId: string;
	name: string;
	sourceTex: string;
	jobDescription?: string | null;
}) {
	const [row] = await db
		.insert(resumes)
		.values({
			id: nanoid(),
			userId: input.userId,
			name: input.name,
			sourceTex: input.sourceTex,
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
		sourceTex?: string;
		jobDescription?: string | null;
		pdfFileId?: string | null;
		compileStatus?: CompileStatus;
		compileError?: string | null;
		compiledAt?: Date | null;
	},
) {
	const [row] = await db
		.update(resumes)
		.set({
			...data,
			updatedAt: new Date(),
		})
		.where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)))
		.returning();

	return row ?? null;
}

export function applySourceTexPatches(
	sourceTex: string,
	patches: Array<{ old_string: string; new_string: string }>,
) {
	let next = sourceTex;

	for (const [index, patch] of patches.entries()) {
		const oldString = patch.old_string;
		const newString = patch.new_string;
		const occurrences = next.split(oldString).length - 1;

		if (occurrences === 0) {
			throw new Error(
				`Patch ${index + 1}: could not find old_string in the resume source.`,
			);
		}
		if (occurrences > 1) {
			throw new Error(
				`Patch ${index + 1}: old_string matched ${occurrences} times. Include more surrounding context so it is unique.`,
			);
		}

		next = next.replace(oldString, newString);
	}

	if (!next.trim()) {
		throw new Error("Resume source cannot be empty after applying patches.");
	}

	return next;
}

export async function appendResumeSource(
	resumeId: string,
	userId: string,
	text: string,
	ensureLeadingNewline = true,
) {
	const existing = await getResumeForUser(resumeId, userId);
	if (!existing) {
		return null;
	}

	const separator =
		ensureLeadingNewline && !existing.sourceTex.endsWith("\n")
			? "\n"
			: "";
	const next = `${existing.sourceTex}${separator}${text}`;

	return updateResumeForUser(resumeId, userId, {
		sourceTex: next,
		compileStatus: "idle",
		compileError: null,
	});
}

export async function patchResumeSource(
	resumeId: string,
	userId: string,
	patches: Array<{ old_string: string; new_string: string }>,
) {
	const existing = await getResumeForUser(resumeId, userId);
	if (!existing) {
		return null;
	}

	const next = applySourceTexPatches(existing.sourceTex, patches);
	return updateResumeForUser(resumeId, userId, {
		sourceTex: next,
		compileStatus: "idle",
		compileError: null,
	});
}
