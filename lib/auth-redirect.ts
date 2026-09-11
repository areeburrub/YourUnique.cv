import { PlanId } from "@/lib/plans";

export const SIGNUP_PLAN_PARAM = "plan";
export const SIGNUP_PLAN_PRO = "pro";
export const SIGNUP_PLAN_LIFETIME = "lifetime";
export const AUTH_NEXT_PARAM = "next";
export const AUTH_NEXT_JOB_RADAR = "/job-radar";

const ALLOWED_AUTH_NEXT = new Set([AUTH_NEXT_JOB_RADAR]);

export function isProSignupIntent(value?: string | null) {
	return value?.trim().toLowerCase() === SIGNUP_PLAN_PRO;
}

export function isLifetimeSignupIntent(_value?: string | null) {
	return false;
}

export function safeAuthNext(value?: string | null) {
	const path = value?.trim();
	if (!path || !ALLOWED_AUTH_NEXT.has(path)) {
		return null;
	}
	return path;
}

function authQuery(plan?: string | null, next?: string | null) {
	const qs = new URLSearchParams();
	if (isProSignupIntent(plan) || plan === PlanId.PRO) {
		qs.set(SIGNUP_PLAN_PARAM, SIGNUP_PLAN_PRO);
	}
	const destination = safeAuthNext(next);
	if (destination) {
		qs.set(AUTH_NEXT_PARAM, destination);
	}
	const query = qs.toString();
	return query ? `?${query}` : "";
}

export function afterAuthPath(plan?: string | null, next?: string | null) {
	return `/onboarding${authQuery(plan, next)}`;
}

export function postAuthAppPath(next?: string | null) {
	return safeAuthNext(next) ?? "/new-chat";
}

export function afterSignedInPath(opts: {
	onboarded: boolean;
	plan?: string | null;
	next?: string | null;
}) {
	if (opts.onboarded) {
		return postAuthAppPath(opts.next);
	}
	return afterAuthPath(opts.plan, opts.next);
}

export function authPageHref(
	path: "/sign-in" | "/sign-up",
	plan?: string | null,
	next?: string | null,
) {
	return `${path}${authQuery(plan, next)}`;
}
