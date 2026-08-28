import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { isLifetimePlan, isProPlan, PlanId } from "@/lib/plans";

export async function expirePaidAccessIfNeeded(user: {
	id: string;
	planId: string;
	trialEndsAt: Date | null;
	proExpiresAt?: Date | null;
}) {
	if (isLifetimePlan(user.planId)) {
		return user;
	}

	if (isProPlan(user.planId)) {
		if (!user.proExpiresAt || user.proExpiresAt.getTime() > Date.now()) {
			return user;
		}
		await db
			.update(users)
			.set({
				planId: PlanId.FREE,
				proExpiresAt: null,
				updatedAt: new Date(),
			})
			.where(eq(users.id, user.id));
		return { ...user, planId: PlanId.FREE, proExpiresAt: null };
	}

	if (user.planId === PlanId.FREE) {
		return user;
	}

	await db
		.update(users)
		.set({
			planId: PlanId.FREE,
			updatedAt: new Date(),
		})
		.where(eq(users.id, user.id));
	return { ...user, planId: PlanId.FREE };
}

/** @deprecated Use expirePaidAccessIfNeeded */
export async function expireUserTrialIfNeeded(user: {
	id: string;
	planId: string;
	trialEndsAt: Date | null;
	proExpiresAt?: Date | null;
}) {
	return expirePaidAccessIfNeeded(user);
}

export async function startUserTrial(userId: string) {
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
		columns: {
			id: true,
			planId: true,
			trialEndsAt: true,
			proExpiresAt: true,
		},
	});
	if (!user) {
		return { ok: false as const, reason: "missing" as const };
	}
	if (isProPlan(user.planId) || isLifetimePlan(user.planId)) {
		return { ok: false as const, reason: "paid" as const };
	}
	return { ok: true as const, already: true };
}
