import { SignUp } from "@clerk/nextjs";

import { AuthShell } from "@/components/auth/auth-shell";

export default function SignUpPage() {
	return (
		<AuthShell mode="sign-up">
			<SignUp
				routing="path"
				path="/sign-up"
				signInUrl="/sign-in"
				fallbackRedirectUrl="/onboarding"
			/>
		</AuthShell>
	);
}
