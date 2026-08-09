"use client";

import { useEffect } from "react";

import { useSoftNav } from "@/components/app/soft-nav";
import { ChatView } from "@/components/chat/chat-view";

export function NewChatClient({
	autoStartMessage,
	stripOnboardingParam,
}: {
	autoStartMessage?: string;
	stripOnboardingParam?: boolean;
}) {
	const { newChatKey } = useSoftNav();

	useEffect(() => {
		if (!stripOnboardingParam) {
			return;
		}
		const url = new URL(window.location.href);
		if (!url.searchParams.has("onboarding")) {
			return;
		}
		url.searchParams.delete("onboarding");
		const next = `${url.pathname}${url.search}${url.hash}`;
		window.history.replaceState(window.history.state, "", next);
	}, [stripOnboardingParam]);

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<ChatView
				key={newChatKey}
				autoStartMessage={autoStartMessage}
			/>
		</div>
	);
}
