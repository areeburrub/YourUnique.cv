import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { notifyUserActivity } from "@/lib/email/resend-lifecycle";

export async function touchUserActivity(userId: string) {
	const now = new Date();
	const [row] = await db
		.update(users)
		.set({
			lastActivityAt: now,
			quietDripStep: 0,
			quietDripStartedAt: null,
			quietDripLastSentAt: null,
			updatedAt: now,
		})
		.where(eq(users.id, userId))
		.returning({
			email: users.email,
			firstName: users.firstName,
		});
	if (row?.email) {
		notifyUserActivity(row);
	}
}
