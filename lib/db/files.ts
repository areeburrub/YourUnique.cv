import { and, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import { userFiles } from "@/lib/db/schema";
import { fileAppUrl } from "@/lib/uploads";

export async function insertUserFileRow(input: {
	id: string;
	userId: string;
	threadId?: string | null;
	key: string;
	filename: string;
	contentType: string;
	size: number;
}) {
	const [row] = await db
		.insert(userFiles)
		.values({
			id: input.id,
			userId: input.userId,
			threadId: input.threadId ?? null,
			key: input.key,
			filename: input.filename,
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

export async function getUserFilesByIds(fileIds: string[], userId: string) {
	if (fileIds.length === 0) {
		return [];
	}

	return db.query.userFiles.findMany({
		where: and(eq(userFiles.userId, userId), inArray(userFiles.id, fileIds)),
	});
}

export async function getUserFilesByKeys(keys: string[], userId: string) {
	if (keys.length === 0) {
		return [];
	}

	return db.query.userFiles.findMany({
		where: and(eq(userFiles.userId, userId), inArray(userFiles.key, keys)),
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
