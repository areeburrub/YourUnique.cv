export const PlanId = {
	FREE: "FREE",
	PRO: "PRO",
} as const;

export type PlanId = (typeof PlanId)[keyof typeof PlanId];

export type PlanConfig = {
	id: PlanId;
	name: string;
	monthlyLimitUsd: number;
	dailyLimitUsd: number;
	dodoProductId: string | null;
};

export const PLANS: Record<PlanId, PlanConfig> = {
	FREE: {
		id: PlanId.FREE,
		name: "Free",
		monthlyLimitUsd: 1,
		dailyLimitUsd: 0.05,
		dodoProductId: null,
	},
	PRO: {
		id: PlanId.PRO,
		name: "Pro",
		monthlyLimitUsd: 19,
		dailyLimitUsd: 0.95,
		dodoProductId: process.env.DODO_PRO_PRODUCT_ID ?? null,
	},
};

export const PLAN_IDS = [PlanId.FREE, PlanId.PRO] as const;

export function isPlanId(value: string): value is PlanId {
	return value === PlanId.FREE || value === PlanId.PRO;
}

export function isProPlan(planId: string) {
	return planId === PlanId.PRO;
}

export function getPlan(planId: string): PlanConfig {
	if (isPlanId(planId)) {
		return PLANS[planId];
	}
	return PLANS.FREE;
}
