"use client";

import { useUser } from "@clerk/nextjs";

import { AppClerkProvider } from "@/components/app-clerk-provider";
import { HeaderUserMenu } from "@/components/landing/header-user-menu";

function AvatarSlot() {
	const { isLoaded, isSignedIn, user } = useUser();

	if (!isLoaded || !isSignedIn || !user) {
		return <span className="size-11 shrink-0" aria-hidden />;
	}

	return <HeaderUserMenu />;
}

export function SiteHeaderUserMenu() {
	return (
		<AppClerkProvider>
			<AvatarSlot />
		</AppClerkProvider>
	);
}
