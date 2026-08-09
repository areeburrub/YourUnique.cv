import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { userContexts } from "@/lib/db/schema";

export async function getUserContext(userId: string) {
	return db.query.userContexts.findFirst({
		where: eq(userContexts.userId, userId),
	});
}

export async function upsertUserContext(input: {
	userId: string;
	profile: string;
	sourceFileIds: string[];
}) {
	const [row] = await db
		.insert(userContexts)
		.values({
			userId: input.userId,
			profile: input.profile,
			sourceFileIds: input.sourceFileIds,
		})
		.onConflictDoUpdate({
			target: userContexts.userId,
			set: {
				profile: input.profile,
				sourceFileIds: input.sourceFileIds,
				updatedAt: new Date(),
			},
		})
		.returning();

	return row;
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
