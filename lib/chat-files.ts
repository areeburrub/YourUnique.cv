import type { FileUIPart, UIMessage } from "ai";

import { getUserFileForUser } from "@/lib/db/files";
import { getR2Object, getR2SignedGetUrl } from "@/lib/r2";
import { parseFileIdFromAppUrl } from "@/lib/uploads";

type MessagePart = UIMessage["parts"][number];

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

	if (mediaType.startsWith("image/") || mediaType === "application/pdf") {
		const signedUrl = await getR2SignedGetUrl(file.key, 3600);
		return [
			{
				type: "file",
				mediaType,
				filename,
				url: signedUrl,
			},
		];
	}

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
