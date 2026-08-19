"use client";

import { useSoftNav } from "@/components/app/soft-nav";
import {
	CheckoutReturnDialog,
	type CheckoutReturnState,
} from "@/components/chat/checkout-return-dialog";
import { ChatView } from "@/components/chat/chat-view";

export function NewChatClient({
	checkoutReturn,
}: {
	checkoutReturn?: CheckoutReturnState;
}) {
	const { newChatKey } = useSoftNav();

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<ChatView key={newChatKey} />
			{checkoutReturn ? (
				<CheckoutReturnDialog checkoutReturn={checkoutReturn} />
			) : null}
		</div>
	);
}
