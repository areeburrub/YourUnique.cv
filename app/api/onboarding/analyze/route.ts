import { auth } from "@clerk/nextjs/server";
import { handleWorkflowStream } from "@mastra/ai-sdk";
import { createUIMessageStreamResponse } from "ai";

import { MAX_UPLOAD_FILES } from "@/lib/uploads";
import { mastra } from "@/mastra";

export const maxDuration = 120;

function parseFileIds(value: unknown): string[] | null {
	if (!Array.isArray(value) || value.length === 0) {
		return null;
	}

	if (value.length > MAX_UPLOAD_FILES) {
		return null;
	}

	const fileIds: string[] = [];
	for (const item of value) {
		if (typeof item !== "string") {
			return null;
		}
		const fileId = item.trim();
		if (!fileId) {
			return null;
		}
		fileIds.push(fileId);
	}

	return fileIds;
}

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

	const body = await req.json().catch(() => null);
	const fileIds = parseFileIds(body?.fileIds);
	if (!fileIds) {
		return Response.json(
			{
				error: `Provide between 1 and ${MAX_UPLOAD_FILES} file ids`,
			},
			{ status: 400 },
		);
	}

	const stream = await handleWorkflowStream({
		mastra,
		workflowId: "onboarding-context",
		params: {
			resourceId: userId,
			inputData: {
				userId,
				fileIds,
			},
		},
		version: "v6",
	});

	return createUIMessageStreamResponse({ stream });
}
