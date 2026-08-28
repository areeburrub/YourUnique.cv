import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function touchUserActivity(userId: string) {
	const now = new Date();
	await db
		.update(users)
		.set({
			lastActivityAt: now,
			quietDripStep: 0,
			quietDripStartedAt: null,
			quietDripLastSentAt: null,
			updatedAt: now,
		})
		.where(eq(users.id, userId));
}
