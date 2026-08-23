import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { subscriptions, users } from "@/lib/db/schema";
import { PlanId, PLANS, isLifetimePlan } from "@/lib/plans";

type CustomerPayload = {
	metadata?: Record<string, unknown>;
	customer?: {
		email?: string;
		customer_id?: string;
	};
};

type SubscriptionPayloadData = CustomerPayload & {
	subscription_id: string;
	status?: string;
};

function userIdFromMetadata(metadata?: Record<string, unknown>) {
	const value = metadata?.userId ?? metadata?.user_id;
	return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function resolveUserId(data: CustomerPayload) {
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
	const current = await db.query.users.findFirst({
		where: eq(users.id, userId),
		columns: { planId: true },
	});
	const nextPlanId = isLifetimePlan(current?.planId ?? "")
		? PlanId.LIFETIME
		: PlanId.PRO;

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
				planId: nextPlanId,
				...(dodoCustomerId ? { dodoCustomerId } : {}),
				updatedAt: new Date(),
			})
			.where(eq(users.id, userId));
	});
}

type PaymentPayloadData = {
	payment_id?: string;
	subscription_id?: string | null;
	metadata?: Record<string, unknown>;
	customer?: {
		email?: string;
		customer_id?: string;
	};
	product_cart?: { product_id?: string }[] | null;
};

function planIdFromMetadata(metadata?: Record<string, unknown>) {
	const value = metadata?.planId ?? metadata?.plan_id;
	return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function isLifetimePayment(data: PaymentPayloadData) {
	if (data.subscription_id) {
		return false;
	}

	const lifetimeProductId = PLANS.LIFETIME.dodoProductId;
	const fromCart = data.product_cart?.some(
		(item) => lifetimeProductId && item.product_id === lifetimeProductId,
	);
	if (fromCart) {
		return true;
	}

	return planIdFromMetadata(data.metadata) === PlanId.LIFETIME;
}

export async function activateLifetimePurchase(data: PaymentPayloadData) {
	if (!isLifetimePayment(data)) {
		return;
	}

	const userId = await resolveUserId(data);
	if (!userId) {
		console.error("Dodo activateLifetimePurchase: missing userId", {
			paymentId: data.payment_id,
			email: data.customer?.email,
		});
		return;
	}

	const dodoCustomerId = data.customer?.customer_id?.trim() || null;

	await db
		.update(users)
		.set({
			planId: PlanId.LIFETIME,
			...(dodoCustomerId ? { dodoCustomerId } : {}),
			updatedAt: new Date(),
		})
		.where(eq(users.id, userId));
}

export async function downgradeSubscription(data: SubscriptionPayloadData) {
	const userId = await resolveUserId(data);
	const status = data.status ?? "cancelled";
	const dodoCustomerId = data.customer?.customer_id?.trim() || null;

	async function currentPlanId(id: string) {
		const current = await db.query.users.findFirst({
			where: eq(users.id, id),
			columns: { planId: true },
		});
		return current?.planId ?? PlanId.TRIAL;
	}

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

		const keepLifetime = isLifetimePlan(
			await currentPlanId(existing.userId),
		);

		await db.transaction(async (tx) => {
			await tx
				.update(subscriptions)
				.set({ status, planId: PlanId.TRIAL, updatedAt: new Date() })
				.where(eq(subscriptions.id, data.subscription_id));
			await tx
				.update(users)
				.set({
					planId: keepLifetime ? PlanId.LIFETIME : PlanId.TRIAL,
					...(dodoCustomerId ? { dodoCustomerId } : {}),
					updatedAt: new Date(),
				})
				.where(eq(users.id, existing.userId));
		});
		return;
	}

	const keepLifetime = isLifetimePlan(await currentPlanId(userId));

	await db.transaction(async (tx) => {
		await tx
			.insert(subscriptions)
			.values({
				id: data.subscription_id,
				userId,
				status,
				planId: PlanId.TRIAL,
			})
			.onConflictDoUpdate({
				target: subscriptions.id,
				set: {
					userId,
					status,
					planId: PlanId.TRIAL,
					updatedAt: new Date(),
				},
			});

		await tx
			.update(users)
			.set({
				planId: keepLifetime ? PlanId.LIFETIME : PlanId.TRIAL,
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
