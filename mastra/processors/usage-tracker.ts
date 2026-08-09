import type {
	Processor,
	ProcessOutputResultArgs,
} from "@mastra/core/processors";

import { recordUsage } from "@/lib/db/usage";

type OpenRouterUsage = {
	cost?: number;
};

function costFromProviderMetadata(metadata: unknown): number {
	if (!metadata || typeof metadata !== "object") {
		return 0;
	}
	const openrouter = (metadata as { openrouter?: { usage?: OpenRouterUsage } })
		.openrouter;
	const cost = openrouter?.usage?.cost;
	return typeof cost === "number" && Number.isFinite(cost) && cost > 0
		? cost
		: 0;
}

export class UsageTracker implements Processor {
	id = "usage-tracker";
	name = "Usage Tracker";

	async processOutputResult({
		messages,
		result,
		requestContext,
	}: ProcessOutputResultArgs) {
		const userId = requestContext?.get("userId");
		if (typeof userId !== "string" || !userId) {
			return messages;
		}

		let totalCost = 0;
		for (const step of result.steps ?? []) {
			totalCost += costFromProviderMetadata(step.providerMetadata);
		}

		if (totalCost > 0) {
			await recordUsage(userId, totalCost);
		}

		return messages;
	}
}

export const usageTracker = new UsageTracker();
