import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import { ChatView } from "@/components/chat/chat-view";
import {
	getChatThreadForUser,
	listChatMessages,
} from "@/lib/mastra-chats";

type ChatPageProps = {
	params: Promise<{ id: string }>;
};

export default async function ChatPage({ params }: ChatPageProps) {
	const { userId } = await auth();
	await auth.protect();

	if (!userId) {
		redirect("/sign-in");
	}

	const { id } = await params;
	const thread = await getChatThreadForUser(id, userId);
	if (!thread) {
		notFound();
	}

	const initialMessages = await listChatMessages(id, userId);

	return <ChatView threadId={thread.id} initialMessages={initialMessages} />;
}
