import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";

import { getChatThreadForUser } from "@/lib/mastra-chats";
import { getR2SignedPutUrl } from "@/lib/r2";
import {
	fileAppUrl,
	MAX_UPLOAD_BYTES,
	resolveUploadMediaType,
	sanitizeFilename,
} from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(req: Request) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	let body: {
		filename?: string;
		contentType?: string;
		size?: number;
		threadId?: string | null;
	};
	try {
		body = await req.json();
	} catch {
		return Response.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	const filename = sanitizeFilename(body.filename || "file");
	const contentType = resolveUploadMediaType({
		filename,
		mediaType: body.contentType,
	});
	const size = typeof body.size === "number" ? body.size : Number.NaN;
	const threadId =
		typeof body.threadId === "string" && body.threadId.length > 0
			? body.threadId
			: null;

	if (!contentType) {
		return Response.json(
			{ error: `Unsupported file type: ${body.filename || filename}` },
			{ status: 400 },
		);
	}

	if (!Number.isFinite(size) || size <= 0) {
		return Response.json({ error: "Invalid file size" }, { status: 400 });
	}

	if (size > MAX_UPLOAD_BYTES) {
		return Response.json(
			{ error: `File too large: ${filename}` },
			{ status: 400 },
		);
	}

	if (threadId) {
		const thread = await getChatThreadForUser(threadId, userId);
		if (!thread) {
			return Response.json({ error: "Chat not found" }, { status: 404 });
		}
	}

	const id = nanoid();
	const key = `users/${userId}/${id}-${filename}`;
	const uploadUrl = await getR2SignedPutUrl(key, contentType);

	return Response.json({
		id,
		key,
		uploadUrl,
		filename,
		mediaType: contentType,
		size,
		url: fileAppUrl(id),
		threadId,
	});
}
