import type { ReactNode } from "react";

import { SlideButton } from "@/components/landing/slide-button";

export function SignedOutHeaderActions() {
	return (
		<>
			<SlideButton
				href="/sign-in"
				variant="outline"
				className="hidden h-11 px-5 text-[15px] sm:inline-flex"
			>
				Log in
			</SlideButton>
			<SlideButton
				href="/sign-up"
				className="h-11 px-5 text-[15px] sm:px-6"
			>
				Sign up
			</SlideButton>
		</>
	);
}

export function SignedInHeaderActions({
	menu,
}: {
	menu?: ReactNode;
}) {
	return (
		<>
			<SlideButton
				href="/new-chat"
				variant="outline"
				className="h-11 px-5 text-[15px] sm:px-6"
			>
				Open app
			</SlideButton>
			{menu}
		</>
	);
}
