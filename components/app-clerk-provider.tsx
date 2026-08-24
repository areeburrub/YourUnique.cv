import { ClerkProvider } from "@clerk/nextjs";

import { clerkAppearance } from "@/lib/clerk-appearance";

export function AppClerkProvider({ children }: { children: React.ReactNode }) {
	return (
		<ClerkProvider
			appearance={clerkAppearance}
			signInUrl="/sign-in"
			signUpUrl="/sign-up"
			signInFallbackRedirectUrl="/onboarding"
			signUpFallbackRedirectUrl="/onboarding"
		>
			{children}
		</ClerkProvider>
	);
}
