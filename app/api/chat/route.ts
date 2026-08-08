import { auth } from "@clerk/nextjs/server";
import { handleChatStream } from "@mastra/ai-sdk";
import { RequestContext } from "@mastra/core/request-context";
import { createUIMessageStreamResponse, type UIMessage } from "ai";

import { prepareMessagesForModel } from "@/lib/chat-files";
import { attachFilesToThread } from "@/lib/db/files";
import { ensureChatThreadForUser } from "@/lib/mastra-chats";
import { parseFileIdFromAppUrl } from "@/lib/uploads";
import { mastra } from "@/mastra";

export const maxDuration = 60;

function previewFromMessages(messages: UIMessage[]) {
	for (let i = messages.length - 1; i >= 0; i -= 1) {
		const message = messages[i];
		if (message?.role !== "user") {
			continue;
		}
		const text = message.parts
			.filter(
				(part): part is { type: "text"; text: string } =>
					part.type === "text" && typeof part.text === "string",
			)
			.map((part) => part.text)
			.join("\n")
			.trim();
		if (text) {
			return text;
		}
	}
	return "Attachment";
}

function fileIdsFromMessages(messages: UIMessage[]) {
	const ids = new Set<string>();
	for (const message of messages) {
		for (const part of message.parts) {
			if (part.type !== "file") {
				continue;
			}
			const fileId = parseFileIdFromAppUrl(part.url);
			if (fileId) {
				ids.add(fileId);
			}
		}
	}
	return [...ids];
}

export async function POST(req: Request) {
	if (!process.env.OPENROUTER_API_KEY) {
		return Response.json(
			{ error: "OPENROUTER_API_KEY is not configured" },
			{ status: 503 },
		);
	}

	const [authState, params] = await Promise.all([auth(), req.json()]);
	const { userId } = authState;
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const threadId =
		typeof params?.threadId === "string" ? params.threadId : undefined;

	if (!threadId) {
		return Response.json({ error: "threadId is required" }, { status: 400 });
	}

	const messages = Array.isArray(params?.messages)
		? (params.messages as UIMessage[])
		: [];

	const thread = await ensureChatThreadForUser({
		userId,
		threadId,
		preview: previewFromMessages(messages),
	});
	if (!thread) {
		return Response.json({ error: "Chat not found" }, { status: 404 });
	}

	const fileIds = fileIdsFromMessages(messages);
	const [preparedMessages] = await Promise.all([
		prepareMessagesForModel(messages, userId),
		fileIds.length > 0
			? attachFilesToThread({ userId, threadId, fileIds })
			: Promise.resolve(),
	]);

	if (Array.isArray(params?.messages)) {
		params.messages = preparedMessages;
	}

	const requestContext = new RequestContext();
	requestContext.set("userId", userId);
	requestContext.set("threadId", threadId);

	const stream = await handleChatStream({
		mastra,
		agentId: "resume-agent",
		params: {
			...params,
			requestContext,
			memory: {
				thread: threadId,
				resource: userId,
			},
		},
		version: "v6",
	});

	return createUIMessageStreamResponse({ stream });
}
