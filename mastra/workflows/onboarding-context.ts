import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

import { getUserFilesByIds } from "@/lib/db/files";
import { getR2Object, getR2SignedGetUrl } from "@/lib/r2";
import { classifyDocsAgent } from "@/mastra/agents/onboarding/classify-docs-agent";
import { profileExtractAgent } from "@/mastra/agents/onboarding/profile-extract-agent";
import { styleExtractAgent } from "@/mastra/agents/onboarding/style-extract-agent";

const docKindSchema = z.enum([
	"resume",
	"experience_letter",
	"offer_letter",
	"cover_letter",
	"other",
]);

const workflowInputSchema = z.object({
	userId: z.string().min(1),
	fileIds: z.array(z.string().min(1)).min(1).max(5),
});

const preparedFileSchema = z.object({
	fileId: z.string(),
	filename: z.string(),
	contentType: z.string(),
	signedUrl: z.string().nullable(),
	textContent: z.string().nullable(),
});

const preparedSchema = z.object({
	userId: z.string(),
	sourceFileIds: z.array(z.string()),
	allFiles: z.array(preparedFileSchema),
});

const classifiedFileSchema = preparedFileSchema.extend({
	kind: docKindSchema,
});

const classifiedSchema = z.object({
	userId: z.string(),
	sourceFileIds: z.array(z.string()),
	allFiles: z.array(classifiedFileSchema),
	resumeFiles: z.array(classifiedFileSchema),
});

const profileResultSchema = z.object({
	profile: z.string(),
	sourceFileIds: z.array(z.string()),
});

const styleResultSchema = z.object({
	style: z.string(),
});

const outputSchema = z.object({
	profile: z.string(),
	style: z.string(),
	sourceFileIds: z.array(z.string()),
});

type PreparedFile = z.infer<typeof preparedFileSchema>;
type ClassifiedFile = z.infer<typeof classifiedFileSchema>;

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

		if (file.signedUrl && isFilePartMediaType(file.contentType)) {
			content.push({
				type: "file",
				data: file.signedUrl,
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
			let signedUrl: string | null = null;
			let textContent: string | null = null;

			if (isTextMediaType(row.contentType)) {
				const object = await getR2Object(row.key);
				const body = object.Body;
				if (!body) {
					continue;
				}
				const bytes = await body.transformToByteArray();
				const text = Buffer.from(bytes).toString("utf8").trim();
				textContent = text
					? `Contents of "${row.filename}":\n\n${text}`
					: `Attached empty text file: ${row.filename}`;
			} else if (isFilePartMediaType(row.contentType)) {
				signedUrl = await getR2SignedGetUrl(row.key, 3600);
			} else {
				continue;
			}

			prepared.push({
				fileId: row.id,
				filename: row.filename,
				contentType: row.contentType,
				signedUrl,
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

const classifyFiles = createStep({
	id: "classify-files",
	inputSchema: preparedSchema,
	outputSchema: classifiedSchema,
	execute: async ({ inputData }) => {
		const content = await buildModelContent(
			inputData.allFiles,
			`Classify each attached career document. Return one kind per fileId.
Allowed kinds: resume, experience_letter, offer_letter, cover_letter, other.
File ids: ${inputData.allFiles.map((file) => file.fileId).join(", ")}`,
		);

		const result = await classifyDocsAgent.generate(
			[
				{
					role: "user",
					content,
				},
			],
			{
				structuredOutput: {
					schema: z.object({
						classifications: z
							.array(
								z.object({
									fileId: z.string(),
									kind: docKindSchema,
								}),
							)
							.min(1),
					}),
				},
			},
		);

		const byId = new Map(
			(result.object?.classifications ?? []).map((item) => [
				item.fileId,
				item.kind,
			]),
		);

		const allFiles: ClassifiedFile[] = inputData.allFiles.map((file) => ({
			...file,
			kind: byId.get(file.fileId) ?? "other",
		}));

		return {
			userId: inputData.userId,
			sourceFileIds: inputData.sourceFileIds,
			allFiles,
			resumeFiles: allFiles.filter((file) => file.kind === "resume"),
		};
	},
});

const extractProfile = createStep({
	id: "extract-profile",
	inputSchema: classifiedSchema,
	outputSchema: profileResultSchema,
	execute: async ({ inputData }) => {
		const content = await buildModelContent(
			inputData.allFiles,
			"Analyze all attached career documents and produce a complete Profile markdown document. Use every useful signal across the files.",
		);

		const result = await profileExtractAgent.generate(
			[
				{
					role: "user",
					content,
				},
			],
			{
				structuredOutput: {
					schema: z.object({
						profile: z.string().min(1),
					}),
				},
			},
		);

		const profile = result.object?.profile?.trim();
		if (!profile) {
			throw new Error("Failed to extract profile from documents");
		}

		return {
			profile,
			sourceFileIds: inputData.sourceFileIds,
		};
	},
});

const extractStyle = createStep({
	id: "extract-style",
	inputSchema: classifiedSchema,
	outputSchema: styleResultSchema,
	execute: async ({ inputData }) => {
		const styleSource =
			inputData.resumeFiles.length > 0
				? inputData.resumeFiles
				: inputData.allFiles;

		const prompt =
			inputData.resumeFiles.length > 0
				? "Analyze the attached resume document(s) and produce a Style guide markdown that captures the writer's voice and formatting habits."
				: "No resume was identified. Infer a lightweight Style guide markdown from the attached career documents.";

		const content = await buildModelContent(styleSource, prompt);

		const result = await styleExtractAgent.generate(
			[
				{
					role: "user",
					content,
				},
			],
			{
				structuredOutput: {
					schema: z.object({
						style: z.string().min(1),
					}),
				},
			},
		);

		const style = result.object?.style?.trim();
		if (!style) {
			throw new Error("Failed to extract style guide from documents");
		}

		return { style };
	},
});

const combineResults = createStep({
	id: "combine-results",
	inputSchema: z.object({
		"extract-profile": profileResultSchema,
		"extract-style": styleResultSchema,
	}),
	outputSchema: outputSchema,
	execute: async ({ inputData }) => {
		const profile = inputData["extract-profile"].profile.trim();
		const style = inputData["extract-style"].style.trim();
		const sourceFileIds = inputData["extract-profile"].sourceFileIds;

		if (!profile || !style) {
			throw new Error("Failed to combine profile and style results");
		}

		return {
			profile,
			style,
			sourceFileIds,
		};
	},
});

export const onboardingContextWorkflow = createWorkflow({
	id: "onboarding-context",
	inputSchema: workflowInputSchema,
	outputSchema: outputSchema,
})
	.then(prepareFiles)
	.then(classifyFiles)
	.parallel([extractProfile, extractStyle])
	.then(combineResults);

onboardingContextWorkflow.commit();
