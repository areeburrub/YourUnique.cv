import { eq } from "drizzle-orm";
import DodoPayments from "dodopayments";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { dodoEnvironment } from "@/lib/dodo";

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
