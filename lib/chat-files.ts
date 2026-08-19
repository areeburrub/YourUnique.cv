import type { FileUIPart, UIMessage } from "ai";

import {
	getUserFileForUser,
	getUserFilesByIds,
	getUserFilesByKeys,
} from "@/lib/db/files";
import { getR2Object, getR2SignedGetUrl } from "@/lib/r2";
import { fileAppUrl, parseFileIdFromAppUrl } from "@/lib/uploads";

type MessagePart = UIMessage["parts"][number];

function r2ObjectKeyFromUrl(url: string) {
	try {
		const parsed = new URL(url);
		let path = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
		const bucket = process.env.R2_BUCKET_NAME;
		if (bucket && path.startsWith(`${bucket}/`)) {
			path = path.slice(bucket.length + 1);
		}
		if (path.startsWith("users/")) {
			return path;
		}
		return null;
	} catch {
		return null;
	}
}

export function fileIdsFromMessages(messages: UIMessage[]) {
	const ids = new Set<string>();
	for (const message of messages) {
		for (const part of message.parts) {
			if (part.type !== "file") {
				continue;
			}
			const fileId = parseFileIdFromAppUrl(part.url);
			if (fileId) {
				ids.add(fileId);
			}
		}
	}
	return [...ids];
}

export async function hydrateMessageFileParts(
	messages: UIMessage[],
	userId: string,
): Promise<UIMessage[]> {
	const fileIds = new Set<string>();
	const keys = new Set<string>();

	for (const message of messages) {
		for (const part of message.parts) {
			if (
				part.type !== "file" ||
				!("url" in part) ||
				typeof part.url !== "string"
			) {
				continue;
			}
			const fileId = parseFileIdFromAppUrl(part.url);
			if (fileId) {
				fileIds.add(fileId);
				continue;
			}
			const key = r2ObjectKeyFromUrl(part.url);
			if (key) {
				keys.add(key);
			}
		}
	}

	const [byId, byKey] = await Promise.all([
		getUserFilesByIds([...fileIds], userId),
		getUserFilesByKeys([...keys], userId),
	]);

	const filesById = new Map(byId.map((file) => [file.id, file]));
	const filesByKey = new Map(byKey.map((file) => [file.key, file]));

	return messages.map((message) => ({
		...message,
		parts: message.parts.map((part) => {
			if (
				part.type !== "file" ||
				!("url" in part) ||
				typeof part.url !== "string"
			) {
				return part;
			}

			const fileId = parseFileIdFromAppUrl(part.url);
			const key = fileId ? null : r2ObjectKeyFromUrl(part.url);
			const file = fileId
				? filesById.get(fileId)
				: key
					? filesByKey.get(key)
					: undefined;

			if (!file) {
				return part;
			}

			return {
				...part,
				type: "file" as const,
				url: fileAppUrl(file.id),
				filename: part.filename || file.filename,
				mediaType: part.mediaType || file.contentType,
			} satisfies FileUIPart;
		}),
	}));
}

async function filePartToModelParts(
	part: FileUIPart,
	userId: string,
): Promise<MessagePart[]> {
	const fileId = parseFileIdFromAppUrl(part.url);
	if (!fileId) {
		if (part.url.startsWith("data:") || part.url.startsWith("http")) {
			return [part];
		}
		return [
			{
				type: "text",
				text: `[Attached file: ${part.filename || "file"}]`,
			},
		];
	}

	const file = await getUserFileForUser(fileId, userId);
	if (!file) {
		return [
			{
				type: "text",
				text: `[Attached file unavailable: ${part.filename || fileId}]`,
			},
		];
	}

	const mediaType = part.mediaType || file.contentType;
	const filename = part.filename || file.filename;

	const object = await getR2Object(file.key);
	const body = object.Body;
	if (!body) {
		return [
			{
				type: "text",
				text: `[Attached file missing: ${file.filename}]`,
			},
		];
	}

	const bytes = await body.transformToByteArray();

	if (mediaType.startsWith("image/") || mediaType === "application/pdf") {
		return [
			{
				type: "file",
				mediaType,
				filename,
				url: `data:${mediaType};base64,${Buffer.from(bytes).toString("base64")}`,
			},
		];
	}

	if (mediaType === "text/plain" || mediaType === "text/markdown") {
		const text = Buffer.from(bytes).toString("utf8").trim();
		return [
			{
				type: "text",
				text: text
					? `Attached file "${filename}":\n\n${text}`
					: `Attached empty text file: ${filename}`,
			},
		];
	}

	return [
		{
			type: "text",
			text: `The user attached "${filename}" (${mediaType}). Binary Office documents are stored, but only PDF/text/image contents are readable in chat right now. Ask them to paste key text if needed.`,
		},
	];
}

function needsFileResolution(part: MessagePart): part is FileUIPart {
	return part.type === "file" && Boolean(parseFileIdFromAppUrl(part.url));
}

export async function prepareMessagesForModel(
	messages: UIMessage[],
	userId: string,
): Promise<UIMessage[]> {
	return Promise.all(
		messages.map(async (message) => {
			if (!message.parts.some((part) => needsFileResolution(part))) {
				return message;
			}

			const resolvedParts = await Promise.all(
				message.parts.map(async (part) => {
					if (!needsFileResolution(part)) {
						return [part] as MessagePart[];
					}
					return filePartToModelParts(part, userId);
				}),
			);

			return {
				...message,
				parts: resolvedParts.flat(),
			};
		}),
	);
}
