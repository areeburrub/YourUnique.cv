import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { afterAuthPath } from "@/lib/auth-redirect";

export default async function SignInPage({
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
		<AuthShell mode="sign-in">
			<SignInForm plan={plan} />
		</AuthShell>
	);
}
