import { toAISdkMessages } from "@mastra/ai-sdk/ui";
import type { UIMessage } from "ai";
import { nanoid } from "nanoid";
import { cache } from "react";

import type { ChatThreadListItem } from "@/lib/chats";
import { mastra } from "@/mastra";

export const PROFILE_CHAT_KIND = "profile-edit";

export function profileChatResourceId(userId: string) {
	return `profile:${userId}`;
}

export function legacyProfileEditThreadId(userId: string) {
	return `profile-edit:${userId}`;
}

export function isProfileEditThread(thread: {
	id: string;
	metadata?: Record<string, unknown> | null;
	resourceId?: string | null;
}) {
	if (thread.id.startsWith("profile-edit:")) {
		return true;
	}
	if (thread.metadata?.kind === PROFILE_CHAT_KIND) {
		return true;
	}
	if (
		typeof thread.resourceId === "string" &&
		thread.resourceId.startsWith("profile:")
	) {
		return true;
	}
	return false;
}

async function getProfileMemory() {
	const agent = mastra.getAgentById("profile-edit-agent");
	const memory = await agent.getMemory();
	if (!memory) {
		throw new Error("Profile edit memory is not configured");
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

function toListItem(thread: {
	id: string;
	title?: string | null;
	metadata?: Record<string, unknown> | null;
	updatedAt: Date;
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
		kind: "profile" as const,
	};
}

export async function createProfileChatThread(input: {
	userId: string;
	threadId?: string;
	preview?: string;
}) {
	const memory = await getProfileMemory();
	const preview = input.preview?.trim() || "";

	return memory.createThread({
		threadId: input.threadId ?? nanoid(),
		resourceId: profileChatResourceId(input.userId),
		title: "",
		metadata: {
			kind: PROFILE_CHAT_KIND,
			...(preview ? { preview } : {}),
		},
		saveThread: true,
	});
}

export async function ensureProfileChatThreadForUser(input: {
	userId: string;
	threadId: string;
	preview?: string;
}) {
	const memory = await getProfileMemory();
	const existing = await memory.getThreadById({ threadId: input.threadId });
	if (existing) {
		if (
			existing.resourceId !== profileChatResourceId(input.userId) &&
			existing.resourceId !== input.userId
		) {
			return null;
		}
		if (!isProfileEditThread(existing)) {
			return null;
		}
		return existing;
	}

	return createProfileChatThread({
		userId: input.userId,
		threadId: input.threadId,
		preview: input.preview,
	});
}

export async function listProfileChatThreads(
	userId: string,
	options?: { limit?: number; page?: number },
): Promise<{
	threads: ChatThreadListItem[];
	page: number;
	perPage: number;
	total: number;
	hasMore: boolean;
}> {
	const memory = await getProfileMemory();
	const page = options?.page ?? 0;
	const perPage = options?.limit ?? 100;
	const resourceId = profileChatResourceId(userId);

	const [result, legacy] = await Promise.all([
		memory.listThreads({
			filter: { resourceId },
			orderBy: { field: "updatedAt", direction: "DESC" },
			page,
			perPage,
		}),
		page === 0
			? memory.getThreadById({
					threadId: legacyProfileEditThreadId(userId),
				})
			: Promise.resolve(null),
	]);

	const threads = result.threads.map(toListItem);
	const seen = new Set(threads.map((thread) => thread.id));

	if (
		legacy &&
		legacy.resourceId === userId &&
		!seen.has(legacy.id)
	) {
		threads.unshift(toListItem(legacy));
		threads.sort(
			(a, b) =>
				new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
		);
	}

	return {
		threads,
		page: result.page,
		perPage: typeof result.perPage === "number" ? result.perPage : perPage,
		total: result.total + (legacy && legacy.resourceId === userId && !seen.has(legacy.id) ? 1 : 0),
		hasMore: result.hasMore,
	};
}

export async function renameProfileChatThreadForUser(
	threadId: string,
	userId: string,
	title: string,
) {
	const memory = await getProfileMemory();
	const thread = await memory.getThreadById({ threadId });
	if (!thread || !isProfileEditThread(thread)) {
		return null;
	}
	if (
		thread.resourceId !== profileChatResourceId(userId) &&
		thread.resourceId !== userId
	) {
		return null;
	}

	return memory.updateThread({
		id: threadId,
		title,
		metadata: thread.metadata ?? {},
	});
}

export async function deleteProfileChatThreadForUser(
	threadId: string,
	userId: string,
) {
	const memory = await getProfileMemory();
	const thread = await memory.getThreadById({ threadId });
	if (!thread || !isProfileEditThread(thread)) {
		return false;
	}
	if (
		thread.resourceId !== profileChatResourceId(userId) &&
		thread.resourceId !== userId
	) {
		return false;
	}

	await memory.deleteThread(threadId);
	return true;
}

export const getProfileChatThreadForUser = cache(
	async (threadId: string, userId: string) => {
		const memory = await getProfileMemory();
		const thread = await memory.getThreadById({ threadId });
		if (!thread || !isProfileEditThread(thread)) {
			return null;
		}
		if (
			thread.resourceId !== profileChatResourceId(userId) &&
			thread.resourceId !== userId
		) {
			return null;
		}
		return thread;
	},
);

export async function listProfileChatMessages(
	userId: string,
	threadId: string,
): Promise<UIMessage[]> {
	const thread = await getProfileChatThreadForUser(threadId, userId);
	if (!thread) {
		return [];
	}

	const memory = await getProfileMemory();
	const { messages } = await memory.recall({
		threadId,
		perPage: false,
		orderBy: { field: "createdAt", direction: "ASC" },
	});

	return toAISdkMessages(messages, {
		version: "v6",
	}) as UIMessage[];
}
