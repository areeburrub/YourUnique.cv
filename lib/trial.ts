import { TRIAL_DAYS } from "@/lib/plan-copy";
import {
	START_TRIAL_PATH,
	checkoutPath,
	isPaidPlan,
	isTrialPlan,
	PlanId,
} from "@/lib/plans";

export function addTrialDays(from = new Date(), days = TRIAL_DAYS) {
	const next = new Date(from);
	next.setUTCDate(next.getUTCDate() + days);
	return next;
}

export function isTrialActive(
	planId: string,
	trialEndsAt: Date | null | undefined,
	now = new Date(),
) {
	return (
		isTrialPlan(planId) &&
		Boolean(trialEndsAt) &&
		trialEndsAt!.getTime() > now.getTime()
	);
}

export function hasUsedTrial(trialEndsAt: Date | null | undefined) {
	return Boolean(trialEndsAt);
}

export function canStartTrial(
	planId: string,
	trialEndsAt: Date | null | undefined,
	now = new Date(),
) {
	if (isPaidPlan(planId) || isTrialActive(planId, trialEndsAt, now)) {
		return false;
	}
	return !hasUsedTrial(trialEndsAt);
}

export function trialDaysRemaining(
	trialEndsAt: Date | null | undefined,
	now = new Date(),
) {
	if (!trialEndsAt) {
		return 0;
	}
	const ms = trialEndsAt.getTime() - now.getTime();
	if (ms <= 0) {
		return 0;
	}
	return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function getUpgradeCta(input: {
	planId: string;
	trialEndsAt?: Date | null;
}) {
	if (isPaidPlan(input.planId)) {
		return null;
	}
	if (canStartTrial(input.planId, input.trialEndsAt)) {
		return {
			href: START_TRIAL_PATH,
			label: `Start ${TRIAL_DAYS}-day trial`,
		};
	}
	return {
		href: checkoutPath(PlanId.PRO),
		label: "Get Pro",
	};
}

export function isStartTrialPath(href: string) {
	return href === START_TRIAL_PATH || href.startsWith(`${START_TRIAL_PATH}?`);
}
