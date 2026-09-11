import type { ReactNode } from "react";

import { SlideButton } from "@/components/landing/slide-button";
import { authPageHref } from "@/lib/auth-redirect";

export function SignedOutHeaderActions({ next }: { next?: string }) {
	return (
		<>
			<SlideButton
				href={authPageHref("/sign-in", null, next)}
				variant="outline"
				className="hidden h-11 px-5 text-[15px] sm:inline-flex"
			>
				Log in
			</SlideButton>
			<SlideButton
				href={authPageHref("/sign-up", null, next)}
				className="h-11 px-5 text-[15px] sm:px-6"
			>
				Sign up
			</SlideButton>
		</>
	);
}

export function SignedInHeaderActions({
	menu,
	next,
}: {
	menu?: ReactNode;
	next?: string;
}) {
	return (
		<>
			<SlideButton
				href={next ?? "/new-chat"}
				variant="outline"
				className="h-11 px-5 text-[15px] sm:px-6"
			>
				Open app
			</SlideButton>
			{menu}
		</>
	);
}
