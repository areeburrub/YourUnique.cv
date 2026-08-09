export const ONBOARDING_KICKOFF_MESSAGE =
	"[start_onboarding] Please welcome me and help me get started.";

export function isOnboardingKickoffMessage(text: string) {
	return text.trim() === ONBOARDING_KICKOFF_MESSAGE;
}
