import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { afterSignedInPath } from "@/lib/auth-redirect";
import { getUserById } from "@/lib/db/users";

export default async function SignUpPage({
	searchParams,
}: {
	searchParams: Promise<{ plan?: string; next?: string }>;
}) {
	const { userId } = await auth();
	const { plan, next } = await searchParams;

	if (userId) {
		const user = await getUserById(userId);
		redirect(
			afterSignedInPath({
				onboarded: Boolean(user?.onboardedAt),
				plan,
				next,
			}),
		);
	}

	return (
		<AuthShell mode="sign-up">
			<SignUpForm plan={plan} next={next} />
		</AuthShell>
	);
}
