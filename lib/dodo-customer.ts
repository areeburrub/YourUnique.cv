import { eq } from "drizzle-orm";
import DodoPayments from "dodopayments";
import { cache } from "react";

import { db } from "@/lib/db";
import { activateSubscription } from "@/lib/db/subscriptions";
import { users } from "@/lib/db/schema";
import { dodoEnvironment } from "@/lib/dodo";
import { PLANS, isPaidPlan } from "@/lib/plans";

function dodoClient() {
	return new DodoPayments({
		bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
		environment: dodoEnvironment(),
	});
}

export async function resolveDodoCustomerId(input: {
	userId: string;
	email?: string | null;
}) {
	const existing = await db.query.users.findFirst({
		where: eq(users.id, input.userId),
		columns: { dodoCustomerId: true },
	});
	if (existing?.dodoCustomerId) {
		return existing.dodoCustomerId;
	}

	const email = input.email?.trim().toLowerCase();
	if (!email) {
		return null;
	}

	const client = dodoClient();
	const result = await client.customers.list({
		email,
		page_size: 1,
	});
	const customerId = result.items[0]?.customer_id ?? null;
	if (!customerId) {
		return null;
	}

	await db
		.update(users)
		.set({ dodoCustomerId: customerId, updatedAt: new Date() })
		.where(eq(users.id, input.userId));

	return customerId;
}

export const syncPaidPlanFromDodo = cache(async function syncPaidPlanFromDodo(input: {
	userId: string;
	email?: string | null;
	planId?: string | null;
}) {
	if (isPaidPlan(input.planId ?? "")) {
		return input.planId ?? null;
	}

	try {
		const customerId = await resolveDodoCustomerId(input);
		if (!customerId) {
			return input.planId ?? null;
		}

		const client = dodoClient();
		const result = await client.subscriptions.list({
			customer_id: customerId,
			status: "active",
			page_size: 10,
		});
		const proProductId = PLANS.PRO.dodoProductId;
		const active = result.items.find(
			(item) => !proProductId || item.product_id === proProductId,
		);
		if (!active) {
			return input.planId ?? null;
		}

		await activateSubscription({
			subscription_id: active.subscription_id,
			status: active.status,
			metadata: { userId: input.userId },
			customer: {
				email: input.email?.trim() || undefined,
				customer_id: customerId,
			},
		});
		return "PRO";
	} catch (error) {
		console.error("Dodo syncPaidPlanFromDodo failed", error);
		return input.planId ?? null;
	}
});
