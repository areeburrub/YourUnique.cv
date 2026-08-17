export const SIGNUP_PLAN_PARAM = "plan";
export const SIGNUP_PLAN_PRO = "pro";

export function isProSignupIntent(value?: string | null) {
	return value?.trim().toLowerCase() === SIGNUP_PLAN_PRO;
}

export function afterAuthPath(plan?: string | null) {
	if (isProSignupIntent(plan)) {
		return `/onboarding?${SIGNUP_PLAN_PARAM}=${SIGNUP_PLAN_PRO}`;
	}
	return "/onboarding";
}

export function authPageHref(
	path: "/sign-in" | "/sign-up",
	plan?: string | null,
) {
	if (isProSignupIntent(plan)) {
		return `${path}?${SIGNUP_PLAN_PARAM}=${SIGNUP_PLAN_PRO}`;
	}
	return path;
}
