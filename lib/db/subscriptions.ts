import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { subscriptions, users } from "@/lib/db/schema";
import { PlanId } from "@/lib/plans";

type SubscriptionPayloadData = {
	subscription_id: string;
	status?: string;
	metadata?: Record<string, unknown>;
	customer?: {
		email?: string;
		customer_id?: string;
	};
};

function userIdFromMetadata(metadata?: Record<string, unknown>) {
	const value = metadata?.userId ?? metadata?.user_id;
	return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function resolveUserId(data: SubscriptionPayloadData) {
	const fromMeta = userIdFromMetadata(data.metadata);
	if (fromMeta) {
		return fromMeta;
	}

	const email = data.customer?.email?.trim().toLowerCase();
	if (!email) {
		return null;
	}

	const user = await db.query.users.findFirst({
		where: eq(users.email, email),
		columns: { id: true },
	});
	return user?.id ?? null;
}

export async function activateSubscription(data: SubscriptionPayloadData) {
	const userId = await resolveUserId(data);
	if (!userId) {
		console.error("Dodo activateSubscription: missing userId", {
			subscriptionId: data.subscription_id,
			email: data.customer?.email,
		});
		return;
	}

	const status = data.status ?? "active";
	const dodoCustomerId = data.customer?.customer_id?.trim() || null;

	await db.transaction(async (tx) => {
		await tx
			.insert(subscriptions)
			.values({
				id: data.subscription_id,
				userId,
				status,
				planId: PlanId.PRO,
			})
			.onConflictDoUpdate({
				target: subscriptions.id,
				set: {
					userId,
					status,
					planId: PlanId.PRO,
					updatedAt: new Date(),
				},
			});

		await tx
			.update(users)
			.set({
				planId: PlanId.PRO,
				...(dodoCustomerId ? { dodoCustomerId } : {}),
				updatedAt: new Date(),
			})
			.where(eq(users.id, userId));
	});
}

export async function downgradeSubscription(data: SubscriptionPayloadData) {
	const userId = await resolveUserId(data);
	const status = data.status ?? "cancelled";
	const dodoCustomerId = data.customer?.customer_id?.trim() || null;

	if (!userId) {
		const existing = await db.query.subscriptions.findFirst({
			where: eq(subscriptions.id, data.subscription_id),
		});
		if (!existing) {
			console.error("Dodo downgradeSubscription: missing userId", {
				subscriptionId: data.subscription_id,
				email: data.customer?.email,
			});
			return;
		}

		await db.transaction(async (tx) => {
			await tx
				.update(subscriptions)
				.set({ status, planId: PlanId.FREE, updatedAt: new Date() })
				.where(eq(subscriptions.id, data.subscription_id));
			await tx
				.update(users)
				.set({
					planId: PlanId.FREE,
					...(dodoCustomerId ? { dodoCustomerId } : {}),
					updatedAt: new Date(),
				})
				.where(eq(users.id, existing.userId));
		});
		return;
	}

	await db.transaction(async (tx) => {
		await tx
			.insert(subscriptions)
			.values({
				id: data.subscription_id,
				userId,
				status,
				planId: PlanId.FREE,
			})
			.onConflictDoUpdate({
				target: subscriptions.id,
				set: {
					userId,
					status,
					planId: PlanId.FREE,
					updatedAt: new Date(),
				},
			});

		await tx
			.update(users)
			.set({
				planId: PlanId.FREE,
				...(dodoCustomerId ? { dodoCustomerId } : {}),
				updatedAt: new Date(),
			})
			.where(eq(users.id, userId));
	});
}

export async function getDodoCustomerId(userId: string) {
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
		columns: { dodoCustomerId: true },
	});
	return user?.dodoCustomerId ?? null;
}
