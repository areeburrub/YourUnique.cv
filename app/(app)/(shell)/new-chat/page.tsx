import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getUserContext } from "@/lib/db/contexts";
import { ONBOARDING_KICKOFF_MESSAGE } from "@/lib/onboarding-kickoff";

import { NewChatClient } from "./_components/new-chat-client";

export default async function NewChatPage() {
	const { userId } = await auth();
	await auth.protect();

	if (!userId) {
		redirect("/sign-in");
	}

	const context = await getUserContext(userId);

	return (
		<NewChatClient
			autoStartMessage={
				context ? undefined : ONBOARDING_KICKOFF_MESSAGE
			}
		/>
	);
}
