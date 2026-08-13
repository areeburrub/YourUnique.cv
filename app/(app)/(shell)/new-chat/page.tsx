import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { NewChatClient } from "./_components/new-chat-client";

export default async function NewChatPage() {
	const { userId } = await auth();
	await auth.protect();

	if (!userId) {
		redirect("/sign-in");
	}

	return <NewChatClient />;
}
