import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { NewChatClient } from "./_components/new-chat-client";

export default async function NewChatPage({
	searchParams,
}: {
	searchParams: Promise<{
		status?: string;
		subscription_id?: string;
		payment_id?: string;
	}>;
}) {
	const { userId } = await auth();
	await auth.protect();

	if (!userId) {
		redirect("/sign-in");
	}

	const params = await searchParams;

	return (
		<NewChatClient
			checkoutReturn={{
				status: params.status ?? null,
				subscriptionId: params.subscription_id ?? null,
				paymentId: params.payment_id ?? null,
			}}
		/>
	);
}
