import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { isPaidPlan, isTrialPlan, PlanId } from "@/lib/plans";
import { addTrialDays, canStartTrial, isTrialActive } from "@/lib/trial";

export async function expireUserTrialIfNeeded(user: {
	id: string;
	planId: string;
	trialEndsAt: Date | null;
}) {
	if (isPaidPlan(user.planId)) {
		return user;
	}

	if (isTrialActive(user.planId, user.trialEndsAt)) {
		if (user.planId === PlanId.TRIAL) {
			return user;
		}
		await db
			.update(users)
			.set({
				planId: PlanId.TRIAL,
				updatedAt: new Date(),
			})
			.where(eq(users.id, user.id));
		return { ...user, planId: PlanId.TRIAL };
	}

	if (isTrialPlan(user.planId) && user.trialEndsAt) {
		if (user.planId === PlanId.TRIAL) {
			return user;
		}
		await db
			.update(users)
			.set({
				planId: PlanId.TRIAL,
				updatedAt: new Date(),
			})
			.where(eq(users.id, user.id));
		return { ...user, planId: PlanId.TRIAL };
	}

	const trialEndsAt = addTrialDays();
	await db
		.update(users)
		.set({
			planId: PlanId.TRIAL,
			trialEndsAt,
			updatedAt: new Date(),
		})
		.where(eq(users.id, user.id));

	return {
		...user,
		planId: PlanId.TRIAL,
		trialEndsAt,
	};
}

export async function startUserTrial(userId: string) {
	return db.transaction(async (tx) => {
		const user = await tx.query.users.findFirst({
			where: eq(users.id, userId),
			columns: {
				id: true,
				planId: true,
				trialEndsAt: true,
			},
		});
		if (!user) {
			return { ok: false as const, reason: "missing" as const };
		}
		if (isPaidPlan(user.planId)) {
			return { ok: false as const, reason: "paid" as const };
		}
		if (isTrialActive(user.planId, user.trialEndsAt)) {
			return { ok: true as const, already: true };
		}
		if (!canStartTrial(user.planId, user.trialEndsAt)) {
			return { ok: false as const, reason: "used" as const };
		}

		const trialEndsAt = addTrialDays();
		await tx
			.update(users)
			.set({
				planId: PlanId.TRIAL,
				trialEndsAt,
				updatedAt: new Date(),
			})
			.where(eq(users.id, userId));

		return { ok: true as const, already: false, trialEndsAt };
	});
}
