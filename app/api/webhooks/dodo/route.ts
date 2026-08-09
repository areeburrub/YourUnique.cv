import { Webhooks } from "@dodopayments/nextjs";

import {
	activateSubscription,
	downgradeSubscription,
} from "@/lib/db/subscriptions";

export const POST = Webhooks({
	webhookKey: process.env.DODO_WEBHOOK_SECRET!,
	onSubscriptionActive: async (payload) => {
		await activateSubscription(payload.data);
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
