import { toAISdkMessages } from "@mastra/ai-sdk/ui";
import type { UIMessage } from "ai";
import { nanoid } from "nanoid";
import { cache } from "react";

import type { ChatThreadListItem } from "@/lib/chats";
import { hydrateMessageFileParts } from "@/lib/chat-files";
import {
	isProfileEditThread,
	legacyProfileEditThreadId,
	listProfileChatThreads,
} from "@/lib/profile-chat";
import { mastra } from "@/mastra";

async function getResumeMemory() {
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

export async function createChatThread(input: {
	userId: string;
	threadId?: string;
	preview?: string;
}) {
	const memory = await getResumeMemory();
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
	const memory = await getResumeMemory();
	const existing = await memory.getThreadById({ threadId: input.threadId });
	if (existing) {
		if (existing.resourceId !== input.userId) {
			return null;
		}
		if (isProfileEditThread(existing)) {
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

async function countHiddenProfileThreads(userId: string) {
	const memory = await getResumeMemory();
	const legacy = await memory.getThreadById({
		threadId: legacyProfileEditThreadId(userId),
	});
	return legacy && legacy.resourceId === userId ? 1 : 0;
}

export async function listChatThreads(
	userId: string,
	options?: { limit?: number; page?: number; kind?: "resume" | "profile" },
): Promise<{
	threads: ChatThreadListItem[];
	page: number;
	perPage: number;
	total: number;
	hasMore: boolean;
}> {
	if (options?.kind === "profile") {
		return listProfileChatThreads(userId, {
			limit: options.limit,
			page: options.page,
		});
	}

	const memory = await getResumeMemory();
	const page = options?.page ?? 0;
	const perPage = options?.limit ?? 100;
	const [result, hiddenProfileCount] = await Promise.all([
		memory.listThreads({
			filter: { resourceId: userId },
			orderBy: { field: "updatedAt", direction: "DESC" },
			page,
			perPage,
		}),
		countHiddenProfileThreads(userId),
	]);

	const threads = result.threads
		.filter((thread) => !isProfileEditThread(thread))
		.map((thread) => {
			const metadataPreview =
				typeof thread.metadata?.preview === "string"
					? thread.metadata.preview
					: "";

			return {
				id: thread.id,
				title: thread.title?.trim() || "New chat",
				preview: previewFromText(metadataPreview),
				updatedAt: thread.updatedAt.toISOString(),
			};
		});

	return {
		threads,
		page: result.page,
		perPage: typeof result.perPage === "number" ? result.perPage : perPage,
		total: Math.max(0, result.total - hiddenProfileCount),
		hasMore: result.hasMore,
	};
}

export async function renameChatThreadForUser(
	threadId: string,
	userId: string,
	title: string,
) {
	const memory = await getResumeMemory();
	const thread = await memory.getThreadById({ threadId });
	if (!thread || thread.resourceId !== userId || isProfileEditThread(thread)) {
		return null;
	}

	return memory.updateThread({
		id: threadId,
		title,
		metadata: thread.metadata ?? {},
	});
}

export async function deleteChatThreadForUser(threadId: string, userId: string) {
	const memory = await getResumeMemory();
	const thread = await memory.getThreadById({ threadId });
	if (!thread || thread.resourceId !== userId || isProfileEditThread(thread)) {
		return false;
	}

	await memory.deleteThread(threadId);
	return true;
}

export const getChatThreadForUser = cache(
	async (threadId: string, userId: string) => {
		const memory = await getResumeMemory();
		const thread = await memory.getThreadById({ threadId });
		if (!thread || thread.resourceId !== userId || isProfileEditThread(thread)) {
			return null;
		}
		return thread;
	},
);

export async function listChatMessages(
	threadId: string,
	userId: string,
): Promise<UIMessage[]> {
	const memory = await getResumeMemory();
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
