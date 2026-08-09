export type UsageStatusResponse = {
	blocked: boolean;
	scope: "daily" | "monthly" | null;
	resetAt: string | null;
	plan: {
		id: string;
		name: string;
		monthlyLimitUsd: number;
		dailyLimitUsd: number;
		dodoProductId: string | null;
	};
	usage: {
		today: number;
		rolling30d: number;
	};
	bonusCreditsUsd: number;
	supportEmail: string | null;
};

export const usageStatusKey = ["usage-status"] as const;

export async function fetchUsageStatus(): Promise<UsageStatusResponse> {
	const response = await fetch("/api/usage/status");
	if (!response.ok) {
		throw new Error("Failed to load usage status");
	}
	return response.json() as Promise<UsageStatusResponse>;
}

export function buildCheckoutUrl(input: {
	productId: string;
	userId: string;
	email?: string | null;
}) {
	const params = new URLSearchParams({
		productId: input.productId,
		metadata_userId: input.userId,
	});
	if (input.email) {
		params.set("email", input.email);
	}
	return `/api/checkout?${params.toString()}`;
}

export function getUpgradeHref(input?: {
	userId?: string;
	email?: string | null;
	productId?: string | null;
}) {
	const productId = input?.productId?.trim();
	if (productId && input?.userId) {
		return buildCheckoutUrl({
			productId,
			userId: input.userId,
			email: input.email,
		});
	}
	return "/api/checkout";
}
