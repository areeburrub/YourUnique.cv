import { after } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { handleChatStream } from "@mastra/ai-sdk";
import { RequestContext } from "@mastra/core/request-context";
import { createUIMessageStreamResponse, type UIMessage } from "ai";

import { lastUserMessageText, resolveChatAgentId } from "@/lib/chat-intent";
import { createChatActivityTransform } from "@/lib/chat-activity-stream";
import { checkUsageLimit } from "@/lib/db/usage";
import { touchUserActivity } from "@/lib/email/activity";
import { loadResumeBriefing } from "@/lib/resume-briefing";
import { resumeRequestIdKey } from "@/lib/resume-turn";
import {
	ensureProfileChatThreadForUser,
	profileChatResourceId,
} from "@/lib/profile-chat";
import { mastra } from "@/mastra";

export const maxDuration = 300;

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
	return "Profile edit";
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

	after(() => touchUserActivity(userId));

	const threadId =
		typeof params?.threadId === "string" ? params.threadId : undefined;
	if (!threadId) {
		return Response.json({ error: "threadId is required" }, { status: 400 });
	}

	const messages = Array.isArray(params?.messages)
		? (params.messages as UIMessage[])
		: [];

	const thread = await ensureProfileChatThreadForUser({
		userId,
		threadId,
		preview: previewFromMessages(messages),
	});
	if (!thread) {
		return Response.json({ error: "Chat not found" }, { status: 404 });
	}

	const agentId = resolveChatAgentId({
		chatSurface: "profile",
		lastUserText: lastUserMessageText(messages),
	});

	const requestContext = new RequestContext();
	requestContext.set("userId", userId);
	requestContext.set("threadId", threadId);
	requestContext.set("chatSurface", "profile");
	requestContext.set(resumeRequestIdKey(), crypto.randomUUID());
	if (agentId === "resume-agent") {
		requestContext.set("resumeBriefing", await loadResumeBriefing(userId));
	}

	const stream = await handleChatStream({
		mastra,
		agentId,
		params: {
			...params,
			requestContext,
			memory: {
				thread: threadId,
				resource: thread.resourceId || profileChatResourceId(userId),
			},
		},
		version: "v6",
	});

	return createUIMessageStreamResponse({
		stream: stream.pipeThrough(createChatActivityTransform()),
	});
}
