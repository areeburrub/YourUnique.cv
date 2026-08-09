import { toAISdkMessages } from "@mastra/ai-sdk/ui";
import type { UIMessage } from "ai";
import { nanoid } from "nanoid";
import { cache } from "react";

import type { ChatThreadListItem } from "@/lib/chats";
import { hydrateMessageFileParts } from "@/lib/chat-files";
import {
	isProfileEditThread,
	listProfileChatThreads,
	profileChatResourceId,
} from "@/lib/profile-chat";
import { mastra } from "@/mastra";

async function getChatMemory() {
	const agent = mastra.getAgentById("resume-agent");
	const memory = await agent.getMemory();
	if (!memory) {
		throw new Error("Mastra memory is not configured");
	}
	return memory;
}

function previewFromText(text: string) {
	const cleaned = text.replace(/\s+/g, " ").trim();
	if (!cleaned) {
		return "";
	}
	return cleaned.length > 160 ? `${cleaned.slice(0, 160).trimEnd()}…` : cleaned;
}

function ownsChatThread(
	thread: { resourceId?: string | null },
	userId: string,
) {
	return (
		thread.resourceId === userId ||
		thread.resourceId === profileChatResourceId(userId)
	);
}

function toListItem(thread: {
	id: string;
	title?: string | null;
	metadata?: Record<string, unknown> | null;
	updatedAt: Date;
	resourceId?: string | null;
}): ChatThreadListItem {
	const metadataPreview =
		typeof thread.metadata?.preview === "string"
			? thread.metadata.preview
			: "";

	return {
		id: thread.id,
		title: thread.title?.trim() || "New chat",
		preview: previewFromText(metadataPreview),
		updatedAt: thread.updatedAt.toISOString(),
		kind: isProfileEditThread(thread) ? "profile" : "chat",
	};
}

export async function createChatThread(input: {
	userId: string;
	threadId?: string;
	preview?: string;
}) {
	const memory = await getChatMemory();
	const preview = input.preview?.trim() || "";

	return memory.createThread({
		threadId: input.threadId ?? nanoid(),
		resourceId: input.userId,
		title: "",
		metadata: preview ? { preview } : {},
		saveThread: true,
	});
}

export async function ensureChatThreadForUser(input: {
	userId: string;
	threadId: string;
	preview?: string;
}) {
	const memory = await getChatMemory();
	const existing = await memory.getThreadById({ threadId: input.threadId });
	if (existing) {
		if (!ownsChatThread(existing, input.userId)) {
			return null;
		}
		return existing;
	}

	return createChatThread({
		userId: input.userId,
		threadId: input.threadId,
		preview: input.preview,
	});
}

export async function listChatThreads(
	userId: string,
	options?: { limit?: number; page?: number },
): Promise<{
	threads: ChatThreadListItem[];
	page: number;
	perPage: number;
	total: number;
	hasMore: boolean;
}> {
	const memory = await getChatMemory();
	const page = options?.page ?? 0;
	const perPage = options?.limit ?? 100;
	const [result, profilePage] = await Promise.all([
		memory.listThreads({
			filter: { resourceId: userId },
			orderBy: { field: "updatedAt", direction: "DESC" },
			page,
			perPage,
		}),
		page === 0
			? listProfileChatThreads(userId, { limit: perPage, page: 0 })
			: Promise.resolve({
					threads: [] as ChatThreadListItem[],
					total: 0,
					hasMore: false,
				}),
	]);

	const mainThreads = result.threads.map(toListItem);
	const merged = new Map<string, ChatThreadListItem>();

	for (const thread of [...mainThreads, ...profilePage.threads]) {
		const existing = merged.get(thread.id);
		if (!existing) {
			merged.set(thread.id, {
				...thread,
				kind: thread.kind ?? "chat",
			});
			continue;
		}
		if (
			new Date(thread.updatedAt).getTime() >
			new Date(existing.updatedAt).getTime()
		) {
			merged.set(thread.id, {
				...thread,
				kind: thread.kind ?? existing.kind ?? "chat",
			});
		}
	}

	const threads = [...merged.values()].sort(
		(a, b) =>
			new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
	);

	const pageThreads =
		page === 0 ? threads.slice(0, perPage) : mainThreads;

	return {
		threads: pageThreads,
		page: result.page,
		perPage: typeof result.perPage === "number" ? result.perPage : perPage,
		total: Math.max(result.total, threads.length),
		hasMore: result.hasMore || Boolean(profilePage.hasMore),
	};
}

export async function renameChatThreadForUser(
	threadId: string,
	userId: string,
	title: string,
) {
	const memory = await getChatMemory();
	const thread = await memory.getThreadById({ threadId });
	if (!thread || !ownsChatThread(thread, userId)) {
		return null;
	}

	return memory.updateThread({
		id: threadId,
		title,
		metadata: thread.metadata ?? {},
	});
}

export async function deleteChatThreadForUser(threadId: string, userId: string) {
	const memory = await getChatMemory();
	const thread = await memory.getThreadById({ threadId });
	if (!thread || !ownsChatThread(thread, userId)) {
		return false;
	}

	await memory.deleteThread(threadId);
	return true;
}

export const getChatThreadForUser = cache(
	async (threadId: string, userId: string) => {
		const memory = await getChatMemory();
		const thread = await memory.getThreadById({ threadId });
		if (!thread || !ownsChatThread(thread, userId)) {
			return null;
		}
		return thread;
	},
);

export async function listChatMessages(
	threadId: string,
	userId: string,
): Promise<UIMessage[]> {
	const thread = await getChatThreadForUser(threadId, userId);
	if (!thread) {
		return [];
	}

	const memory = await getChatMemory();
	const { messages } = await memory.recall({
		threadId,
		perPage: false,
		orderBy: { field: "createdAt", direction: "ASC" },
	});

	const uiMessages = toAISdkMessages(messages, {
		version: "v6",
	}) as UIMessage[];
	return hydrateMessageFileParts(uiMessages, userId);
}
