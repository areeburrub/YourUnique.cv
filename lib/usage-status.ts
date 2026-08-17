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

export const DAILY_USAGE_WARNING_RATIO = 0.9;

export function utcDateString(date = new Date()) {
	return date.toISOString().slice(0, 10);
}

export function nextUtcMidnight(from = new Date()) {
	return new Date(
		Date.UTC(
			from.getUTCFullYear(),
			from.getUTCMonth(),
			from.getUTCDate() + 1,
		),
	);
}

export function isNearDailyLimit(status: UsageStatusResponse) {
	if (status.blocked) {
		return false;
	}
	const limit = status.plan.dailyLimitUsd;
	if (!(limit > 0)) {
		return false;
	}
	return status.usage.today / limit >= DAILY_USAGE_WARNING_RATIO;
}

export function formatDailyResetAt(date: Date) {
	if (Number.isNaN(date.getTime())) {
		return null;
	}
	return date
		.toLocaleString(undefined, {
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		})
		.replace(/\b(am|pm)\b/gi, (match) => match.toUpperCase());
}

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
