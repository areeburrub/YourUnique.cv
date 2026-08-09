export function buildOnboardingKickoff(name?: string | null) {
	const trimmed = name?.trim();
	const tag = trimmed
		? `[start_onboarding:name=${trimmed}]`
		: "[start_onboarding]";
	return `${tag} Please welcome me and help me get started.`;
}

export function isOnboardingKickoffMessage(text: string) {
	const trimmed = text.trim();
	return (
		trimmed.startsWith("[start_onboarding]") ||
		trimmed.startsWith("[start_onboarding:")
	);
}
