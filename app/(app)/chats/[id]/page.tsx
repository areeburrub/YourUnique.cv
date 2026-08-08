import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

import { ChatView } from "./_components/chat-view";
import {
	getChatThreadForUser,
	listChatMessages,
} from "@/lib/mastra-chats";

type ChatThreadPageProps = {
	params: Promise<{ id: string }>;
};

export default async function ChatThreadPage({ params }: ChatThreadPageProps) {
	const { userId } = await auth();
	if (!userId) {
		notFound();
	}

	const { id } = await params;
	const thread = await getChatThreadForUser(id, userId);
	if (!thread) {
		notFound();
	}

	const initialMessages = await listChatMessages(thread.id);

	return <ChatView threadId={thread.id} initialMessages={initialMessages} />;
}
