import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { PlanId } from "@/lib/plans";
import { notifyUserSignedUp } from "@/lib/email/resend-lifecycle";

export type SyncUserInput = {
	id: string;
	email: string;
	firstName?: string | null;
	lastName?: string | null;
	imageUrl?: string | null;
};

export async function upsertUser(input: SyncUserInput) {
	const email = input.email.trim().toLowerCase();
	const existing = await db.query.users.findFirst({
		where: eq(users.id, input.id),
		columns: { id: true },
	});
	const [user] = await db
		.insert(users)
		.values({
			id: input.id,
			email,
			firstName: input.firstName ?? null,
			lastName: input.lastName ?? null,
			imageUrl: input.imageUrl ?? null,
			planId: PlanId.FREE,
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

	if (!existing && user) {
		notifyUserSignedUp(user);
	}

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
			lastActivityAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(users.id, userId))
		.returning();

	return row ?? null;
}
