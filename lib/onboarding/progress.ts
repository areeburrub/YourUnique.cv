import type { userContexts } from "@/lib/db/schema";

export type OnboardingWizardStep =
	| "resume"
	| "linkedin"
	| "notes"
	| "generate"
	| "template"
	| "plan";

type UserContextRow = typeof userContexts.$inferSelect;

export function resolveOnboardingStep(
	context: UserContextRow | null | undefined,
): OnboardingWizardStep {
	if (!context?.sourceFileIds?.length) {
		return "resume";
	}
	if (context.linkedinUrl == null) {
		return "linkedin";
	}
	if (context.introduction == null) {
		return "notes";
	}
	if (!context.profile?.trim()) {
		return "generate";
	}
	if (!context.templateRef?.trim()) {
		return "template";
	}
	return "plan";
}

export function isOnboardingContextComplete(
	context: UserContextRow | null | undefined,
): boolean {
	return (
		Boolean(context?.sourceFileIds?.length) &&
		context?.linkedinUrl != null &&
		context?.introduction != null &&
		Boolean(context.profile?.trim()) &&
		Boolean(context.templateRef?.trim())
	);
}
