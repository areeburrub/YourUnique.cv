import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { userContexts } from "@/lib/db/schema";
import type { ResumeStyleMemory } from "@/lib/resume-style";

export async function getUserContext(userId: string) {
	return db.query.userContexts.findFirst({
		where: eq(userContexts.userId, userId),
	});
}

export async function upsertUserContext(input: {
	userId: string;
	profile: string;
	sourceFileIds: string[];
	templateRef?: string | null;
	linkedinUrl?: string | null;
	introduction?: string | null;
}) {
	const [row] = await db
		.insert(userContexts)
		.values({
			userId: input.userId,
			profile: input.profile,
			sourceFileIds: input.sourceFileIds,
			templateRef: input.templateRef ?? null,
			linkedinUrl: input.linkedinUrl ?? null,
			introduction: input.introduction ?? null,
		})
		.onConflictDoUpdate({
			target: userContexts.userId,
			set: {
				profile: input.profile,
				sourceFileIds: input.sourceFileIds,
				...(input.templateRef !== undefined
					? { templateRef: input.templateRef }
					: {}),
				...(input.linkedinUrl !== undefined
					? { linkedinUrl: input.linkedinUrl }
					: {}),
				...(input.introduction !== undefined
					? { introduction: input.introduction }
					: {}),
				updatedAt: new Date(),
			},
		})
		.returning();

	return row;
}

export async function patchUserContextOnboarding(input: {
	userId: string;
	sourceFileIds?: string[];
	linkedinUrl?: string | null;
	introduction?: string | null;
	profile?: string;
	templateRef?: string | null;
}) {
	const existing = await getUserContext(input.userId);
	const now = new Date();

	if (!existing) {
		const [row] = await db
			.insert(userContexts)
			.values({
				userId: input.userId,
				profile: input.profile ?? "",
				sourceFileIds: input.sourceFileIds ?? [],
				linkedinUrl: input.linkedinUrl ?? null,
				introduction: input.introduction ?? null,
				templateRef: input.templateRef ?? null,
			})
			.returning();
		return row;
	}

	const [row] = await db
		.update(userContexts)
		.set({
			...(input.sourceFileIds !== undefined
				? { sourceFileIds: input.sourceFileIds }
				: {}),
			...(input.linkedinUrl !== undefined
				? { linkedinUrl: input.linkedinUrl }
				: {}),
			...(input.introduction !== undefined
				? { introduction: input.introduction }
				: {}),
			...(input.profile !== undefined ? { profile: input.profile } : {}),
			...(input.templateRef !== undefined
				? { templateRef: input.templateRef }
				: {}),
			updatedAt: now,
		})
		.where(eq(userContexts.userId, input.userId))
		.returning();

	return row ?? null;
}

export async function updateUserContextProfile(
	userId: string,
	profile: string,
) {
	const [row] = await db
		.update(userContexts)
		.set({
			profile,
			updatedAt: new Date(),
		})
		.where(eq(userContexts.userId, userId))
		.returning();

	return row ?? null;
}

export async function updateUserContextResumeStyle(
	userId: string,
	resumeStyle: ResumeStyleMemory,
) {
	const existing = await getUserContext(userId);
	if (!existing) {
		throw new Error("Create a career profile before saving style memory");
	}

	const [row] = await db
		.update(userContexts)
		.set({
			resumeStyle,
			updatedAt: new Date(),
		})
		.where(eq(userContexts.userId, userId))
		.returning();

	return row ?? null;
}

export async function updateUserContextTemplateRef(
	userId: string,
	templateRef: string,
) {
	const existing = await getUserContext(userId);
	if (!existing) {
		throw new Error("Create a career profile before selecting a template");
	}

	const [row] = await db
		.update(userContexts)
		.set({
			templateRef,
			updatedAt: new Date(),
		})
		.where(eq(userContexts.userId, userId))
		.returning();

	return row ?? null;
}
