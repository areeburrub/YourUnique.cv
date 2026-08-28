import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { emailUnsubscribes, users } from "@/lib/db/schema";

export async function updatePromotionalEmailPreference(
	userId: string,
	enabled: boolean,
) {
	const [row] = await db
		.update(users)
		.set({
			emailRemindersEnabled: enabled,
			emailTrialEnabled: enabled,
			updatedAt: new Date(),
		})
		.where(eq(users.id, userId))
		.returning({
			emailRemindersEnabled: users.emailRemindersEnabled,
		});
	return row ? { emailPromotionalEnabled: row.emailRemindersEnabled } : null;
}

export async function applyEmailUnsubscribe(input: {
	email: string;
	userId?: string;
}) {
	const email = input.email.trim().toLowerCase();
	await db
		.insert(emailUnsubscribes)
		.values({ email })
		.onConflictDoNothing();

	const patch = {
		emailRemindersEnabled: false,
		emailTrialEnabled: false,
		updatedAt: new Date(),
	};

	if (input.userId) {
		await db.update(users).set(patch).where(eq(users.id, input.userId));
		return;
	}

	await db.update(users).set(patch).where(eq(users.email, email));
}
