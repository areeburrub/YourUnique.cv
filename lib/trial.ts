import { TRIAL_DAYS } from "@/lib/plan-copy";
import {
	START_TRIAL_PATH,
	checkoutPath,
	isPaidPlan,
	isFreePlan,
	PlanId,
} from "@/lib/plans";

export function addTrialDays(from = new Date(), days = TRIAL_DAYS) {
	const next = new Date(from);
	next.setUTCDate(next.getUTCDate() + days);
	return next;
}

export function isTrialActive(
	_planId: string,
	_trialEndsAt: Date | null | undefined,
	_now = new Date(),
) {
	return false;
}

export function hasUsedTrial(_trialEndsAt: Date | null | undefined) {
	return true;
}

export function canStartTrial(
	_planId: string,
	_trialEndsAt: Date | null | undefined,
	_now = new Date(),
) {
	return false;
}

export function trialDaysRemaining(
	_trialEndsAt: Date | null | undefined,
	_now = new Date(),
) {
	return 0;
}

export function getUpgradeCta(input: {
	planId: string;
	trialEndsAt?: Date | null;
	proExpiresAt?: Date | null;
}) {
	if (isPaidPlan(input.planId)) {
		return null;
	}
	return {
		href: checkoutPath(PlanId.PRO),
		label: "Get Pro",
	};
}

export function isStartTrialPath(href: string) {
	return href === START_TRIAL_PATH || href.startsWith(`${START_TRIAL_PATH}?`);
}

export function isFreeAccess(planId: string) {
	return isFreePlan(planId);
}
