export const PlanId = {
	FREE: "FREE",
	PRO: "PRO",
	LIFETIME: "LIFETIME",
} as const;

export type PlanId = (typeof PlanId)[keyof typeof PlanId];

export type PlanConfig = {
	id: PlanId;
	name: string;
	monthlyLimitUsd: number;
	dailyLimitUsd: number;
	dodoProductId: string | null;
};

export const PRO_MONTHLY_RESUMES_LABEL = "500+";

export const PLANS: Record<PlanId, PlanConfig> = {
	FREE: {
		id: PlanId.FREE,
		name: "Trial",
		monthlyLimitUsd: 0.032,
		dailyLimitUsd: 0.2,
		dodoProductId: null,
	},
	PRO: {
		id: PlanId.PRO,
		name: "Pro",
		monthlyLimitUsd: 8,
		dailyLimitUsd: 1.6,
		dodoProductId: process.env.DODO_PRO_PRODUCT_ID ?? null,
	},
	LIFETIME: {
		id: PlanId.LIFETIME,
		name: "Lifetime",
		monthlyLimitUsd: 8,
		dailyLimitUsd: 1.6,
		dodoProductId: process.env.DODO_LIFETIME_PRODUCT_ID ?? null,
	},
};

export const PLAN_IDS = [PlanId.FREE, PlanId.PRO, PlanId.LIFETIME] as const;

export function isPlanId(value: string): value is PlanId {
	return (
		value === PlanId.FREE ||
		value === PlanId.PRO ||
		value === PlanId.LIFETIME
	);
}

export function isProPlan(planId: string) {
	return planId === PlanId.PRO;
}

export function isLifetimePlan(planId: string) {
	return planId === PlanId.LIFETIME;
}

export function isPaidPlan(planId: string) {
	return isProPlan(planId) || isLifetimePlan(planId);
}

export function getPlan(planId: string): PlanConfig {
	if (isPlanId(planId)) {
		return PLANS[planId];
	}
	return PLANS.FREE;
}

export function checkoutPath(planId: PlanId = PlanId.PRO) {
	if (planId === PlanId.LIFETIME) {
		return "/api/checkout?plan=lifetime";
	}
	return "/api/checkout";
}
