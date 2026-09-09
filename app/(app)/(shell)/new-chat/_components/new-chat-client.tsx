"use client";

import { useRef } from "react";

import { useSoftNav } from "@/components/app/soft-nav";
import {
	CheckoutReturnDialog,
	type CheckoutReturnState,
} from "@/components/chat/checkout-return-dialog";
import { ChatView } from "@/components/chat/chat-view";

export function NewChatClient({
	checkoutReturn,
	autoPrompt,
}: {
	checkoutReturn?: CheckoutReturnState;
	autoPrompt?: string;
}) {
	const { newChatKey } = useSoftNav();
	const seedKeyRef = useRef(newChatKey);
	const activeAutoPrompt =
		seedKeyRef.current === newChatKey ? autoPrompt : undefined;

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<ChatView key={newChatKey} autoPrompt={activeAutoPrompt} />
			{checkoutReturn ? (
				<CheckoutReturnDialog checkoutReturn={checkoutReturn} />
			) : null}
		</div>
	);
}
