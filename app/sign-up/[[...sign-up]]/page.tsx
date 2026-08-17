import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { afterAuthPath } from "@/lib/auth-redirect";

export default async function SignUpPage({
	searchParams,
}: {
	searchParams: Promise<{ plan?: string }>;
}) {
	const { userId } = await auth();
	const { plan } = await searchParams;

	if (userId) {
		redirect(afterAuthPath(plan));
	}

	return (
		<AuthShell mode="sign-up">
			<SignUpForm plan={plan} />
		</AuthShell>
	);
}
