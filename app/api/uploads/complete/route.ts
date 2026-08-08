import { auth } from "@clerk/nextjs/server";

import { insertUserFileRow } from "@/lib/db/files";
import { getChatThreadForUser } from "@/lib/mastra-chats";
import { headR2Object } from "@/lib/r2";
import {
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
		id?: string;
		key?: string;
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

	const id = typeof body.id === "string" ? body.id : "";
	const key = typeof body.key === "string" ? body.key : "";
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

	if (!id || !key) {
		return Response.json(
			{ error: "Missing upload id or key" },
			{ status: 400 },
		);
	}

	const expectedPrefix = `users/${userId}/${id}-`;
	if (!key.startsWith(expectedPrefix)) {
		return Response.json({ error: "Invalid upload key" }, { status: 400 });
	}

	if (!contentType) {
		return Response.json(
			{ error: `Unsupported file type: ${filename}` },
			{ status: 400 },
		);
	}

	if (!Number.isFinite(size) || size <= 0 || size > MAX_UPLOAD_BYTES) {
		return Response.json({ error: "Invalid file size" }, { status: 400 });
	}

	if (threadId) {
		const thread = await getChatThreadForUser(threadId, userId);
		if (!thread) {
			return Response.json({ error: "Chat not found" }, { status: 404 });
		}
	}

	let verifiedSize: number;
	try {
		const head = await headR2Object(key);
		verifiedSize = head.ContentLength ?? size;
		if (verifiedSize <= 0 || verifiedSize > MAX_UPLOAD_BYTES) {
			return Response.json(
				{ error: "Uploaded file is invalid" },
				{ status: 400 },
			);
		}
	} catch {
		return Response.json(
			{ error: "Upload not found in storage" },
			{ status: 400 },
		);
	}

	const row = await insertUserFileRow({
		id,
		userId,
		threadId,
		key,
		filename,
		contentType,
		size: verifiedSize,
	});

	return Response.json({
		file: {
			id: row.id,
			filename: row.filename,
			mediaType: row.contentType,
			size: row.size,
			url: row.url,
		},
	});
}
