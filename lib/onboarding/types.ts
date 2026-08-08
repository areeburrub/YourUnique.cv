export const ONBOARDING_DOC_KINDS = [
	"resume",
	"experience_letter",
	"offer_letter",
	"cover_letter",
	"other",
] as const;

export type OnboardingDocKind = (typeof ONBOARDING_DOC_KINDS)[number];

export function isOnboardingDocKind(value: unknown): value is OnboardingDocKind {
	return (
		typeof value === "string" &&
		(ONBOARDING_DOC_KINDS as readonly string[]).includes(value)
	);
}
