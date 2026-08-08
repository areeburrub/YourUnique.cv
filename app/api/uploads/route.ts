import { auth } from "@clerk/nextjs/server";

import { createUserFile } from "@/lib/db/files";
import { getChatThreadForUser } from "@/lib/mastra-chats";
import {
	isAllowedUploadMediaType,
	MAX_UPLOAD_BYTES,
	MAX_UPLOAD_FILES,
} from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(req: Request) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	let formData: FormData;
	try {
		formData = await req.formData();
	} catch {
		return Response.json({ error: "Invalid form data" }, { status: 400 });
	}

	const threadIdValue = formData.get("threadId");
	const threadId =
		typeof threadIdValue === "string" && threadIdValue.length > 0
			? threadIdValue
			: null;

	if (threadId) {
		const thread = await getChatThreadForUser(threadId, userId);
		if (!thread) {
			return Response.json({ error: "Chat not found" }, { status: 404 });
		}
	}

	const entries = formData.getAll("files");
	const files = entries.filter((entry): entry is File => entry instanceof File);

	if (files.length === 0) {
		return Response.json({ error: "No files provided" }, { status: 400 });
	}

	if (files.length > MAX_UPLOAD_FILES) {
		return Response.json(
			{ error: `You can upload at most ${MAX_UPLOAD_FILES} files` },
			{ status: 400 },
		);
	}

	const uploaded = [];

	for (const file of files) {
		if (!isAllowedUploadMediaType(file.type)) {
			return Response.json(
				{ error: `Unsupported file type: ${file.type || file.name}` },
				{ status: 400 },
			);
		}

		if (file.size > MAX_UPLOAD_BYTES) {
			return Response.json(
				{ error: `File too large: ${file.name}` },
				{ status: 400 },
			);
		}

		const body = Buffer.from(await file.arrayBuffer());
		const row = await createUserFile({
			userId,
			threadId,
			filename: file.name || "file",
			contentType: file.type,
			size: file.size,
			body,
		});

		uploaded.push({
			id: row.id,
			filename: row.filename,
			mediaType: row.contentType,
			size: row.size,
			url: row.url,
		});
	}

	return Response.json({ files: uploaded });
}
