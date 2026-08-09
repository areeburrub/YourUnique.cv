import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export type SyncUserInput = {
	id: string;
	email: string;
	firstName?: string | null;
	lastName?: string | null;
	imageUrl?: string | null;
};

export async function upsertUser(input: SyncUserInput) {
	const email = input.email.trim().toLowerCase();
	const [user] = await db
		.insert(users)
		.values({
			id: input.id,
			email,
			firstName: input.firstName ?? null,
			lastName: input.lastName ?? null,
			imageUrl: input.imageUrl ?? null,
		})
		.onConflictDoUpdate({
			target: users.id,
			set: {
				email,
				firstName: input.firstName ?? null,
				lastName: input.lastName ?? null,
				imageUrl: input.imageUrl ?? null,
				updatedAt: new Date(),
			},
		})
		.returning();

	return user;
}

export async function deleteUser(id: string) {
	await db.delete(users).where(eq(users.id, id));
}

export async function ensureUserSynced(input: SyncUserInput) {
	const existing = await db.query.users.findFirst({
		where: eq(users.id, input.id),
	});

	if (existing) {
		return existing;
	}

	return upsertUser(input);
}

export async function getUserById(id: string) {
	return db.query.users.findFirst({
		where: eq(users.id, id),
	});
}

export async function markUserOnboarded(userId: string) {
	const [row] = await db
		.update(users)
		.set({
			onboardedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(users.id, userId))
		.returning();

	return row ?? null;
}
