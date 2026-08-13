"use client";

import { useSoftNav } from "@/components/app/soft-nav";
import { ChatView } from "@/components/chat/chat-view";

export function NewChatClient() {
	const { newChatKey } = useSoftNav();

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<ChatView key={newChatKey} />
		</div>
	);
}
