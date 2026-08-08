import { toAISdkMessages } from "@mastra/ai-sdk/ui";
import type { UIMessage } from "ai";
import { nanoid } from "nanoid";
import { cache } from "react";

import type { ChatThreadListItem } from "@/lib/chats";
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
	options?: { limit?: number },
): Promise<ChatThreadListItem[]> {
	const memory = await getResumeMemory();
	const limit = options?.limit ?? 100;
	const { threads } = await memory.listThreads({
		filter: { resourceId: userId },
		orderBy: { field: "updatedAt", direction: "DESC" },
		page: 0,
		perPage: limit,
	});

	return threads.map((thread) => {
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
}

export const getChatThreadForUser = cache(
	async (threadId: string, userId: string) => {
		const memory = await getResumeMemory();
		const thread = await memory.getThreadById({ threadId });
		if (!thread || thread.resourceId !== userId) {
			return null;
		}
		return thread;
	},
);

export async function listChatMessages(threadId: string): Promise<UIMessage[]> {
	const memory = await getResumeMemory();
	const { messages } = await memory.recall({
		threadId,
		perPage: false,
		orderBy: { field: "createdAt", direction: "ASC" },
	});

	return toAISdkMessages(messages, { version: "v6" }) as UIMessage[];
}
