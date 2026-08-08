import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

import { getUserFilesByIds } from "@/lib/db/files";
import {
	PROFILE_MARKER,
	STYLE_MARKER,
} from "@/lib/onboarding/markers";
import { getR2Object } from "@/lib/r2";
import { contextExtractAgent } from "@/mastra/agents/onboarding/context-extract-agent";

const workflowInputSchema = z.object({
	userId: z.string().min(1),
	fileIds: z.array(z.string().min(1)).min(1).max(5),
});

const preparedFileSchema = z.object({
	fileId: z.string(),
	filename: z.string(),
	contentType: z.string(),
	dataUrl: z.string().nullable(),
	textContent: z.string().nullable(),
});

const preparedSchema = z.object({
	userId: z.string(),
	sourceFileIds: z.array(z.string()),
	allFiles: z.array(preparedFileSchema),
});

const outputSchema = z.object({
	profile: z.string(),
	style: z.string(),
	sourceFileIds: z.array(z.string()),
});

type PreparedFile = z.infer<typeof preparedFileSchema>;

const DOCX_TYPE =
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PPTX_TYPE =
	"application/vnd.openxmlformats-officedocument.presentationml.presentation";

function isFilePartMediaType(contentType: string) {
	return (
		contentType === "application/pdf" ||
		contentType === DOCX_TYPE ||
		contentType === PPTX_TYPE ||
		contentType.startsWith("image/")
	);
}

function isTextMediaType(contentType: string) {
	return contentType === "text/plain" || contentType === "text/markdown";
}

async function readR2Bytes(key: string) {
	const object = await getR2Object(key);
	const body = object.Body;
	if (!body) {
		return null;
	}
	return Buffer.from(await body.transformToByteArray());
}

function toDataUrl(contentType: string, bytes: Buffer) {
	return `data:${contentType};base64,${bytes.toString("base64")}`;
}

async function buildModelContent(
	files: PreparedFile[],
	prompt: string,
): Promise<
	Array<
		| { type: "text"; text: string }
		| { type: "file"; data: string; mediaType: string; filename?: string }
	>
> {
	const content: Array<
		| { type: "text"; text: string }
		| { type: "file"; data: string; mediaType: string; filename?: string }
	> = [{ type: "text", text: prompt }];

	for (const file of files) {
		content.push({
			type: "text",
			text: `File id: ${file.fileId}\nFilename: ${file.filename}\nContent type: ${file.contentType}`,
		});

		if (file.textContent) {
			content.push({
				type: "text",
				text: file.textContent,
			});
			continue;
		}

		if (file.dataUrl && isFilePartMediaType(file.contentType)) {
			content.push({
				type: "file",
				data: file.dataUrl,
				mediaType: file.contentType,
				filename: file.filename,
			});
		}
	}

	return content;
}

const prepareFiles = createStep({
	id: "prepare-files",
	inputSchema: workflowInputSchema,
	outputSchema: preparedSchema,
	execute: async ({ inputData }) => {
		const rows = await getUserFilesByIds(inputData.fileIds, inputData.userId);

		if (rows.length === 0) {
			throw new Error("No valid owned files found for analysis");
		}

		const prepared: PreparedFile[] = [];

		for (const row of rows) {
			const bytes = await readR2Bytes(row.key);
			if (!bytes) {
				continue;
			}

			let dataUrl: string | null = null;
			let textContent: string | null = null;

			if (isTextMediaType(row.contentType)) {
				const text = bytes.toString("utf8").trim();
				textContent = text
					? `Contents of "${row.filename}":\n\n${text}`
					: `Attached empty text file: ${row.filename}`;
			} else if (isFilePartMediaType(row.contentType)) {
				dataUrl = toDataUrl(row.contentType, bytes);
			} else {
				continue;
			}

			prepared.push({
				fileId: row.id,
				filename: row.filename,
				contentType: row.contentType,
				dataUrl,
				textContent,
			});
		}

		if (prepared.length === 0) {
			throw new Error("No readable files available for analysis");
		}

		return {
			userId: inputData.userId,
			sourceFileIds: prepared.map((file) => file.fileId),
			allFiles: prepared,
		};
	},
});

function parseContextOutput(text: string) {
	const profileStart = text.indexOf(PROFILE_MARKER);
	const styleStart = text.indexOf(STYLE_MARKER);

	if (profileStart === -1 || styleStart === -1 || styleStart < profileStart) {
		return null;
	}

	const profile = text
		.slice(profileStart + PROFILE_MARKER.length, styleStart)
		.trim();
	const style = text.slice(styleStart + STYLE_MARKER.length).trim();

	if (!profile || !style) {
		return null;
	}

	return { profile, style };
}

const extractContext = createStep({
	id: "extract-context",
	inputSchema: preparedSchema,
	outputSchema: outputSchema,
	execute: async ({ inputData, writer }) => {
		const content = await buildModelContent(
			inputData.allFiles,
			`Analyze all ${inputData.allFiles.length} attached career documents. Use every file. Produce both a Profile markdown document and a Style guide markdown document using the required markers.`,
		);

		const response = await contextExtractAgent.stream([
			{
				role: "user",
				content,
			},
		]);

		await response.fullStream.pipeTo(writer);

		const parsed = parseContextOutput(await response.text);
		if (!parsed) {
			throw new Error("Failed to extract profile and style from documents");
		}

		return {
			profile: parsed.profile,
			style: parsed.style,
			sourceFileIds: inputData.sourceFileIds,
		};
	},
});

export const onboardingContextWorkflow = createWorkflow({
	id: "onboarding-context",
	inputSchema: workflowInputSchema,
	outputSchema: outputSchema,
})
	.then(prepareFiles)
	.then(extractContext);

onboardingContextWorkflow.commit();
