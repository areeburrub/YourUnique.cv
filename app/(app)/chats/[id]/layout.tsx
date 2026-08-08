import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

import { getChatThreadForUser } from "@/lib/mastra-chats";

type ChatThreadLayoutProps = {
	children: React.ReactNode;
	params: Promise<{ id: string }>;
};

export default async function ChatThreadLayout({
	children,
	params,
}: ChatThreadLayoutProps) {
	const { userId } = await auth();
	if (!userId) {
		notFound();
	}

	const { id } = await params;
	const thread = await getChatThreadForUser(id, userId);
	if (!thread) {
		notFound();
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			{children}
		</div>
	);
}
