"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

import { identifyUser, resetMixpanel } from "@/lib/mixpanel";

export function MixpanelIdentify() {
	const { isLoaded, isSignedIn, user } = useUser();
	const identifiedId = useRef<string | null>(null);

	useEffect(() => {
		if (!isLoaded) {
			return;
		}

		if (isSignedIn && user) {
			if (identifiedId.current === user.id) {
				return;
			}
			identifiedId.current = user.id;
			identifyUser(user.id, {
				email: user.primaryEmailAddress?.emailAddress,
				name:
					user.fullName?.trim() ||
					[user.firstName, user.lastName].filter(Boolean).join(" ") ||
					undefined,
			});
			return;
		}

		if (identifiedId.current) {
			identifiedId.current = null;
			resetMixpanel();
		}
	}, [isLoaded, isSignedIn, user]);

	return null;
}
