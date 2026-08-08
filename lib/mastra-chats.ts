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

function textFromUiMessage(message: UIMessage) {
	return message.parts
		.filter(
			(part): part is { type: "text"; text: string } =>
				part.type === "text" && typeof part.text === "string",
		)
		.map((part) => part.text)
		.join("\n")
		.trim();
}

export async function createChatThread(input: {
	userId: string;
	preview?: string;
}) {
	const memory = await getResumeMemory();
	const preview = input.preview?.trim() || "";

	return memory.createThread({
		threadId: nanoid(),
		resourceId: input.userId,
		title: "",
		metadata: preview ? { preview } : {},
		saveThread: true,
	});
}

export async function createChatThreadFromMessage(input: {
	userId: string;
	messageText: string;
}) {
	return createChatThread({
		userId: input.userId,
		preview: previewFromText(input.messageText),
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

	return Promise.all(
		threads.map(async (thread) => {
			const recalled = await memory.recall({
				threadId: thread.id,
				resourceId: userId,
				page: 0,
				perPage: 1,
				orderBy: { field: "createdAt", direction: "DESC" },
			});
			const latest = recalled.messages[0];
			const uiLatest = latest
				? toAISdkMessages([latest], { version: "v6" })[0]
				: undefined;
			const previewFromMessage = uiLatest
				? textFromUiMessage(uiLatest as UIMessage)
				: "";
			const metadataPreview =
				typeof thread.metadata?.preview === "string"
					? thread.metadata.preview
					: "";

			return {
				id: thread.id,
				title: thread.title?.trim() || "New chat",
				preview: previewFromText(previewFromMessage || metadataPreview),
				updatedAt: thread.updatedAt.toISOString(),
				messageCount: recalled.total,
			};
		}),
	);
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
