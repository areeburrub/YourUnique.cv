import { and, eq, inArray, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "@/lib/db";
import { userFiles } from "@/lib/db/schema";
import { putR2Object } from "@/lib/r2";
import { fileAppUrl, sanitizeFilename } from "@/lib/uploads";

export async function createUserFile(input: {
	userId: string;
	threadId?: string | null;
	filename: string;
	contentType: string;
	size: number;
	body: Buffer;
}) {
	const id = nanoid();
	const filename = sanitizeFilename(input.filename);
	const key = `users/${input.userId}/${id}-${filename}`;

	await putR2Object({
		key,
		body: input.body,
		contentType: input.contentType,
	});

	const [row] = await db
		.insert(userFiles)
		.values({
			id,
			userId: input.userId,
			threadId: input.threadId ?? null,
			key,
			filename,
			contentType: input.contentType,
			size: input.size,
		})
		.returning();

	return {
		...row,
		url: fileAppUrl(row.id),
	};
}

export async function getUserFileForUser(fileId: string, userId: string) {
	return db.query.userFiles.findFirst({
		where: and(eq(userFiles.id, fileId), eq(userFiles.userId, userId)),
	});
}

export async function attachFilesToThread(input: {
	userId: string;
	threadId: string;
	fileIds: string[];
}) {
	if (input.fileIds.length === 0) {
		return;
	}

	await db
		.update(userFiles)
		.set({ threadId: input.threadId })
		.where(
			and(
				eq(userFiles.userId, input.userId),
				inArray(userFiles.id, input.fileIds),
				isNull(userFiles.threadId),
			),
		);
}
