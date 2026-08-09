import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import { getUserContext } from "@/lib/db/contexts";
import {
	getChatThreadForUser,
	listChatMessages,
} from "@/lib/mastra-chats";

import { ProfileWorkspace } from "../_components/profile-workspace";

type ProfileChatPageProps = {
	params: Promise<{ threadId: string }>;
};

export default async function ProfileChatPage({
	params,
}: ProfileChatPageProps) {
	const { userId } = await auth();
	await auth.protect();

	if (!userId) {
		redirect("/sign-in");
	}

	const context = await getUserContext(userId);
	if (!context) {
		redirect("/new-chat");
	}

	const { threadId } = await params;
	const thread = await getChatThreadForUser(threadId, userId);
	if (!thread) {
		notFound();
	}

	const initialMessages = await listChatMessages(threadId, userId);

	return (
		<ProfileWorkspace
			threadId={thread.id}
			initialProfile={context.profile}
			initialUpdatedAt={context.updatedAt.toISOString()}
			initialMessages={initialMessages}
		/>
	);
}
