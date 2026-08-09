import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getUserContext } from "@/lib/db/contexts";
import { getUserById } from "@/lib/db/users";
import { buildOnboardingKickoff } from "@/lib/onboarding-kickoff";

import { NewChatClient } from "./_components/new-chat-client";

export default async function NewChatPage({
	searchParams,
}: {
	searchParams: Promise<{ onboarding?: string }>;
}) {
	const { userId } = await auth();
	await auth.protect();

	if (!userId) {
		redirect("/sign-in");
	}

	const [{ onboarding }, context, dbUser, clerkUser] = await Promise.all([
		searchParams,
		getUserContext(userId),
		getUserById(userId),
		currentUser(),
	]);

	const needsCareerContext = !context?.profile?.trim();
	const welcomeName =
		dbUser?.firstName?.trim() || clerkUser?.firstName?.trim() || null;

	return (
		<NewChatClient
			autoStartMessage={
				needsCareerContext
					? buildOnboardingKickoff(welcomeName)
					: undefined
			}
			stripOnboardingParam={onboarding === "1"}
		/>
	);
}
