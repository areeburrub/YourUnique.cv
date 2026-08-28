export const PlanId = {
	FREE: "FREE",
	TRIAL: "TRIAL",
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

export const FREE_RESUMES_LABEL = "20+";
export const PRO_RESUMES_LABEL = "200+";

export const PRO_PRICE_USD = 8;
export const PRO_LIST_PRICE_USD = 20;
export const PRO_DISCOUNT_PERCENT = 60;

export const PLANS: Record<PlanId, PlanConfig> = {
	FREE: {
		id: PlanId.FREE,
		name: "Free",
		monthlyLimitUsd: 0.5,
		dailyLimitUsd: 0.5,
		dodoProductId: null,
	},
	TRIAL: {
		id: PlanId.TRIAL,
		name: "Free",
		monthlyLimitUsd: 0.5,
		dailyLimitUsd: 0.5,
		dodoProductId: null,
	},
	PRO: {
		id: PlanId.PRO,
		name: "Pro",
		monthlyLimitUsd: 5,
		dailyLimitUsd: 5,
		dodoProductId: process.env.DODO_PRO_PRODUCT_ID ?? null,
	},
	LIFETIME: {
		id: PlanId.LIFETIME,
		name: "Lifetime",
		monthlyLimitUsd: 5,
		dailyLimitUsd: 5,
		dodoProductId: process.env.DODO_LIFETIME_PRODUCT_ID ?? null,
	},
};

export const PLAN_IDS = [
	PlanId.FREE,
	PlanId.TRIAL,
	PlanId.PRO,
	PlanId.LIFETIME,
] as const;

export const ADMIN_PLAN_IDS = [PlanId.FREE, PlanId.PRO, PlanId.LIFETIME] as const;

export function isPlanId(value: string): value is PlanId {
	return (
		value === PlanId.FREE ||
		value === PlanId.TRIAL ||
		value === PlanId.PRO ||
		value === PlanId.LIFETIME
	);
}

export function isFreePlan(planId: string) {
	return planId === PlanId.FREE || planId === PlanId.TRIAL;
}

export function isTrialPlan(planId: string) {
	return isFreePlan(planId);
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

export const START_TRIAL_PATH = "/api/start-trial";
