import { auth } from "@clerk/nextjs/server";

import { createChatThreadFromMessage } from "@/lib/mastra-chats";
import { attachFilesToThread } from "@/lib/db/files";

export async function POST(req: Request) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = (await req.json().catch(() => null)) as {
		message?: string;
		fileIds?: string[];
	} | null;

	const message = body?.message?.trim() ?? "";
	const fileIds = Array.isArray(body?.fileIds)
		? body.fileIds.filter((id): id is string => typeof id === "string")
		: [];

	if (!message && fileIds.length === 0) {
		return Response.json(
			{ error: "message or files are required" },
			{ status: 400 },
		);
	}

	const thread = await createChatThreadFromMessage({
		userId,
		messageText: message || "Attachment",
	});

	if (fileIds.length > 0) {
		await attachFilesToThread({
			userId,
			threadId: thread.id,
			fileIds,
		});
	}

	return Response.json({
		id: thread.id,
		title: thread.title?.trim() || "New chat",
	});
}
