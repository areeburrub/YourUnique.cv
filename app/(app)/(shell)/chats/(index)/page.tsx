import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";

import { listChatThreads } from "@/lib/mastra-chats";
import { CHATS_PAGE_SIZE } from "@/lib/chats";

import { ChatsIndex } from "../_components/chats-index";

export default async function ChatsPage() {
	const { userId } = await auth();
	const threadsResult = userId
		? await listChatThreads(userId, { limit: CHATS_PAGE_SIZE, page: 0 })
		: null;

	return (
		<Suspense fallback={null}>
			<ChatsIndex
				initialThreads={threadsResult?.threads ?? []}
				initialHasMore={threadsResult?.hasMore ?? false}
			/>
		</Suspense>
	);
}
