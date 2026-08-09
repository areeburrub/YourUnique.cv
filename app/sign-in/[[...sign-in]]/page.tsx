import { SignIn } from "@clerk/nextjs";

import { AuthShell } from "@/components/auth/auth-shell";

export default function SignInPage() {
	return (
		<AuthShell mode="sign-in">
			<SignIn
				routing="path"
				path="/sign-in"
				signUpUrl="/sign-up"
				fallbackRedirectUrl="/onboarding"
			/>
		</AuthShell>
	);
}
