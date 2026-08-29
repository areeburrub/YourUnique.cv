import { Webhooks } from "@dodopayments/nextjs";

import {
	activateOneTimePurchase,
	activateSubscription,
	downgradeSubscription,
} from "@/lib/db/subscriptions";

export const POST = Webhooks({
	webhookKey: process.env.DODO_WEBHOOK_SECRET!,
	onPaymentSucceeded: async (payload) => {
		await activateOneTimePurchase(payload.data);
	},
	onSubscriptionActive: async (payload) => {
		await activateSubscription(payload.data);
	},
	onSubscriptionUpdated: async (payload) => {
		if (payload.data.status === "active") {
			await activateSubscription(payload.data);
		}
	},
	onSubscriptionRenewed: async (payload) => {
		await activateSubscription(payload.data);
	},
	onSubscriptionCancelled: async (payload) => {
		await downgradeSubscription(payload.data);
	},
	onSubscriptionExpired: async (payload) => {
		await downgradeSubscription(payload.data);
	},
	onSubscriptionFailed: async (payload) => {
		await downgradeSubscription(payload.data);
	},
});
