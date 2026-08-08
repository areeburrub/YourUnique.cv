import { auth } from "@clerk/nextjs/server";
import { handleChatStream } from "@mastra/ai-sdk";
import { RequestContext } from "@mastra/core/request-context";
import { createUIMessageStreamResponse, type UIMessage } from "ai";

import { prepareMessagesForModel } from "@/lib/chat-files";
import { getChatThreadForUser } from "@/lib/mastra-chats";
import { mastra } from "@/mastra";

export const maxDuration = 60;

export async function POST(req: Request) {
	if (!process.env.OPENROUTER_API_KEY) {
		return Response.json(
			{ error: "OPENROUTER_API_KEY is not configured" },
			{ status: 503 },
		);
	}

	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const params = await req.json();
	const threadId =
		typeof params?.threadId === "string" ? params.threadId : undefined;

	if (!threadId) {
		return Response.json({ error: "threadId is required" }, { status: 400 });
	}

	const thread = await getChatThreadForUser(threadId, userId);
	if (!thread) {
		return Response.json({ error: "Chat not found" }, { status: 404 });
	}

	if (Array.isArray(params?.messages)) {
		params.messages = await prepareMessagesForModel(
			params.messages as UIMessage[],
			userId,
		);
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
