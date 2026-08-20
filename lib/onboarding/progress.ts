import type { userContexts } from "@/lib/db/schema";

export type OnboardingWizardStep =
	| "resume"
	| "notes"
	| "generate"
	| "template"
	| "plan";

type UserContextRow = typeof userContexts.$inferSelect;

export function resolveOnboardingStep(
	context: UserContextRow | null | undefined,
): OnboardingWizardStep {
	if (context?.linkedinUrl == null) {
		return "resume";
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
		context?.linkedinUrl != null &&
		context?.introduction != null &&
		Boolean(context.profile?.trim()) &&
		Boolean(context.templateRef?.trim())
	);
}
