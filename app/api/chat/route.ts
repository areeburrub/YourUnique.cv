import { auth } from "@clerk/nextjs/server";
import { handleChatStream } from "@mastra/ai-sdk";
import { RequestContext } from "@mastra/core/request-context";
import { createUIMessageStreamResponse, type UIMessage } from "ai";

import { fileIdsFromMessages, prepareMessagesForModel } from "@/lib/chat-files";
import { getUserContext } from "@/lib/db/contexts";
import { attachFilesToThread } from "@/lib/db/files";
import { checkUsageLimit } from "@/lib/db/usage";
import { ensureChatThreadForUser } from "@/lib/mastra-chats";
import { isOnboardingKickoffMessage } from "@/lib/onboarding-kickoff";
import { mastra } from "@/mastra";

export const maxDuration = 120;

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
			return isOnboardingKickoffMessage(text)
				? "Getting to know you"
				: text;
		}
	}
	return "Attachment";
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

	const limit = await checkUsageLimit(userId);
	if (limit.blocked) {
		return Response.json(
			{
				error: "usage_limit",
				scope: limit.scope,
				resetAt: limit.resetAt?.toISOString() ?? null,
				plan: limit.plan.id,
			},
			{ status: 402 },
		);
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
	const [preparedMessages, context] = await Promise.all([
		prepareMessagesForModel(messages, userId),
		getUserContext(userId),
	]);
	if (fileIds.length > 0) {
		await attachFilesToThread({ userId, threadId, fileIds });
	}

	if (Array.isArray(params?.messages)) {
		params.messages = preparedMessages;
	}

	const needsOnboarding = !context?.profile?.trim();
	const chatSurface =
		params?.chatSurface === "profile" ? "profile" : "main";

	const requestContext = new RequestContext();
	requestContext.set("userId", userId);
	requestContext.set("threadId", threadId);
	requestContext.set("needsOnboarding", needsOnboarding);
	requestContext.set("sourceFileIds", fileIds);
	requestContext.set("chatSurface", chatSurface);

	const stream = await handleChatStream({
		mastra,
		agentId: "app-agent",
		params: {
			...params,
			requestContext,
			memory: {
				thread: threadId,
				resource: thread.resourceId || userId,
			},
		},
		version: "v6",
	});

	return createUIMessageStreamResponse({ stream });
}
