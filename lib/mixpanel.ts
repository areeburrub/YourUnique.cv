"use client";

const MIXPANEL_TOKEN =
	process.env.NEXT_PUBLIC_MIXPANEL_TOKEN ??
	"9d1d077418af4bd7490ce9e642f79c38";

export const MixpanelEvent = {
	LandingResumeUploaded: "Landing Resume Uploaded",
	SignUpStarted: "Sign Up Started",
	SignUpCompleted: "Sign Up Completed",
	SignInStarted: "Sign In Started",
	SignInCompleted: "Sign In Completed",
	OAuthGoogleStarted: "OAuth Google Started",
	SignedOut: "Signed Out",
	OnboardingStepViewed: "Onboarding Step Viewed",
	OnboardingResumeUploaded: "Onboarding Resume Uploaded",
	OnboardingLinkedInSaved: "Onboarding LinkedIn Saved",
	OnboardingNotesSaved: "Onboarding Notes Saved",
	OnboardingProfileGenerationStarted: "Onboarding Profile Generation Started",
	OnboardingProfileGenerationCompleted:
		"Onboarding Profile Generation Completed",
	OnboardingProfileGenerationFailed: "Onboarding Profile Generation Failed",
	OnboardingTemplateSelected: "Onboarding Template Selected",
	OnboardingPlanSelected: "Onboarding Plan Selected",
	OnboardingCompleted: "Onboarding Completed",
	ChatMessageSent: "Chat Message Sent",
	ChatTurnFailed: "Chat Turn Failed",
	ResumePdfReady: "Resume PDF Ready",
	ResumePdfOpened: "Resume PDF Opened",
	ResumePdfDownloaded: "Resume PDF Downloaded",
	UsageLimitHit: "Usage Limit Hit",
	TemplateSelected: "Template Selected",
	CustomTemplateUploadStarted: "Custom Template Upload Started",
	CheckoutStarted: "Checkout Started",
	TrialStarted: "Trial Started",
	PeerlistPromptShown: "Peerlist Prompt Shown",
	PeerlistPromptSnoozed: "Peerlist Prompt Snoozed",
	PeerlistPromptClicked: "Peerlist Prompt Clicked",
	ToolRunStarted: "Tool Run Started",
	ToolRunCompleted: "Tool Run Completed",
	ToolRunFailed: "Tool Run Failed",
	ToolCtaClicked: "Tool CTA Clicked",
} as const;

export type MixpanelEventName =
	(typeof MixpanelEvent)[keyof typeof MixpanelEvent];

type MixpanelClient = typeof import("mixpanel-browser").default;
type EventProps = Record<string, string | number | boolean | null | undefined>;

let client: MixpanelClient | null = null;
let initPromise: Promise<MixpanelClient | null> | null = null;

function isLocalHost() {
	if (typeof window === "undefined") {
		return true;
	}
	const host = window.location.hostname;
	return host === "localhost" || host === "127.0.0.1";
}

export function isMixpanelEnabled() {
	return (
		process.env.NODE_ENV === "production" &&
		Boolean(MIXPANEL_TOKEN) &&
		!isLocalHost()
	);
}

export function initMixpanel() {
	if (!isMixpanelEnabled()) {
		return Promise.resolve(null);
	}
	if (client) {
		return Promise.resolve(client);
	}
	if (!initPromise) {
		initPromise = import("mixpanel-browser")
			.then((mod) => {
				const mixpanel = mod.default;
				mixpanel.init(MIXPANEL_TOKEN, {
					autocapture: true,
					record_sessions_percent: 100,
					record_mask_all_text: false,
					record_mask_all_inputs: false,
					record_inline_images: true,
					record_block_selector: "[data-mp-block]",
				});
				client = mixpanel;
				return mixpanel;
			})
			.catch(() => {
				initPromise = null;
				return null;
			});
	}
	return initPromise;
}

export function trackEvent(
	name: MixpanelEventName,
	properties?: EventProps,
	options?: { sendImmediately?: boolean },
) {
	void initMixpanel().then((mixpanel) => {
		if (!mixpanel) {
			return;
		}
		if (options?.sendImmediately) {
			mixpanel.track(name, properties, {
				transport: "sendBeacon",
				send_immediately: true,
			});
			return;
		}
		mixpanel.track(name, properties);
	});
}

export function identifyUser(
	userId: string,
	traits?: {
		email?: string | null;
		name?: string | null;
		plan?: string | null;
	},
) {
	void initMixpanel().then((mixpanel) => {
		if (!mixpanel) {
			return;
		}
		mixpanel.identify(userId);
		const people: Record<string, string> = {};
		if (traits?.email) {
			people.$email = traits.email;
		}
		if (traits?.name) {
			people.$name = traits.name;
		}
		if (traits?.plan) {
			people.plan = traits.plan;
		}
		if (Object.keys(people).length > 0) {
			mixpanel.people.set(people);
		}
	});
}

export function resetMixpanel() {
	void initMixpanel().then((mixpanel) => {
		mixpanel?.reset();
	});
}

export function setMixpanelPeople(
	properties: Record<string, string | number | boolean>,
) {
	void initMixpanel().then((mixpanel) => {
		mixpanel?.people.set(properties);
	});
}
