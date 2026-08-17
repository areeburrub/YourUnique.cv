import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

import { Spinner } from "@/components/ui/spinner";

export default function SSOCallbackPage() {
	return (
		<div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background">
			<Spinner className="size-6" />
			<p className="text-sm text-muted-foreground">Finishing sign in…</p>
			<AuthenticateWithRedirectCallback />
		</div>
	);
}
