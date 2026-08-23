import { logger, schemaTask } from "@trigger.dev/sdk";
import { generateText, Output, type FilePart } from "ai";
import { nanoid } from "nanoid";
import { z } from "zod";

import { openrouter } from "@/lib/ai/openrouter";
import { getUserFileForUser, insertUserFileRow } from "@/lib/db/files";
import {
	getResumeTemplateForUser,
	updateResumeTemplateForUser,
} from "@/lib/db/templates";
import { extractPdfLinks, formatPdfLinksForModel } from "@/lib/pdf-links";
import { putR2Object, getR2Object } from "@/lib/r2";
import {
	isEmptyDocumentSchema,
	jsonSchemaFromSampleData,
	jsonSchemaFromZod,
	parseWithZod,
	zodFromStoredSchema,
} from "@/lib/resume-templates/parse";
import { renderHandlebarsHtml } from "@/lib/resume-templates/handlebars";
import { customTemplatePreviewPdfKey } from "@/lib/resume-templates/registry";
import { rasterizeSourceFile } from "@/lib/resume-templates/rasterize-source";
import { sanitizeTemplateHtml } from "@/lib/resume-templates/sanitize-html";
import {
	DRAFT_HTML_INSTRUCTIONS,
	DRAFT_SLOTS_INSTRUCTIONS,
} from "@/lib/resume-templates/template-draft-prompt";
import { compileHtmlToPdfAndPng } from "@/trigger/lib/playwright-html";

const TEMPLATE_VISION_MODEL = "google/gemini-3.7-flash";
const EARLY_STOP_SCORE = 90;
const REFINE_ATTEMPTS = 2;

const generatedSlotsSchema = z.object({
	name: z.string().min(1).max(80),
	description: z.string().max(240),
	notes: z.string().min(1),
	sampleData: z.record(z.string(), z.unknown()),
});

const generatedHtmlSchema = z.object({
	html: z.string().min(1),
});

const evaluationSchema = z.object({
	matchScore: z.number().min(0).max(100),
	done: z.boolean(),
	differences: z.array(z.string()),
	revisedHtml: z.string().nullable(),
	revisedNotes: z.string().nullable(),
	revisedSampleData: z.record(z.string(), z.unknown()).nullable(),
	revisedSchema: z.record(z.string(), z.unknown()).nullable(),
});

type GeneratedTemplate = {
	name: string;
	description: string;
	notes: string;
	html: string;
	schema: Record<string, unknown>;
	sampleData: Record<string, unknown>;
};

type Draft = {
	name: string;
	description: string;
	notes: string;
	html: string;
	inputSchema: Record<string, unknown>;
	sampleData: Record<string, unknown>;
};

function visionModel() {
	return openrouter(TEMPLATE_VISION_MODEL);
}

function pageImageParts(
	pages: Array<{
		filename: string;
		mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
		data: Buffer;
	}>,
): FilePart[] {
	return pages.map((page) => ({
		type: "file" as const,
		mediaType: page.mediaType,
		filename: page.filename,
		data: page.data,
	}));
}

async function loadSourcePageImages(input: {
	userId: string;
	fileId: string;
}) {
	const file = await getUserFileForUser(input.fileId, input.userId);
	if (!file) {
		throw new Error("Source file not found");
	}

	const object = await getR2Object(file.key);
	const body = object.Body;
	if (!body) {
		throw new Error("Could not read source file");
	}
	const bytes = Buffer.from(await body.transformToByteArray());
	const rasterized = await rasterizeSourceFile({
		bytes,
		mediaType: file.contentType,
		filename: file.filename,
	});

	return {
		filename: file.filename,
		mediaType: file.contentType,
		pages: rasterized.pages,
		sourcePageCount: rasterized.sourcePageCount,
		bytes,
	};
}

function sourceLayoutBrief(input: {
	sourcePageCount: number;
	attachedPages: number;
}) {
	const attached =
		input.attachedPages < input.sourcePageCount
			? ` (${input.attachedPages} page image(s) attached)`
			: "";
	return `Source page count: ${input.sourcePageCount} A4 page${input.sourcePageCount === 1 ? "" : "s"}${attached}.
Read the page image(s) for density before writing CSS:
- How full is each page? How much empty space is left at the bottom?
- How tight are section gaps, header padding, line-height, and bullet spacing?
- Infer font sizes from the page (name, headings, body, meta) — do not use generic resume sizes.
Match that page count and density. If the source is one full page, stay on one page with similar fill. If it is airy, keep the air. Do not overflow to an extra page or leave a large empty lower half the source does not have.`;
}

function extractJsonObject(raw: string): Record<string, unknown> {
	let text = raw.trim();
	const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
	if (fenced?.[1]) {
		text = fenced[1].trim();
	}
	const start = text.indexOf("{");
	const end = text.lastIndexOf("}");
	if (start === -1 || end === -1 || end <= start) {
		throw new Error("Model response did not contain a JSON object");
	}
	text = text.slice(start, end + 1);
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch (error) {
		throw new Error(
			`Model response was not valid JSON: ${error instanceof Error ? error.message : "parse error"}`,
		);
	}
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		throw new Error("Model response JSON was not an object");
	}
	return parsed as Record<string, unknown>;
}

async function requestSlots(input: {
	filename: string;
	pageParts: FilePart[];
	sourcePageCount: number;
	extractedLinks?: string;
	retryHint?: boolean;
}) {
	// Deliberately not using Output.object here: schema-constrained decoding lets
	// the model satisfy a loosely-typed sampleData record with an empty object,
	// which it reliably does. Asking for plain JSON text makes the model actually
	// write out the transcribed content instead of taking that shortcut.
	const result = await generateText({
		model: visionModel(),
		instructions: `${DRAFT_SLOTS_INSTRUCTIONS}\n\nRespond with ONLY a single raw JSON object (no markdown fences, no commentary) with keys: name, description, notes, sampleData.`,
		providerOptions: {
			openrouter: {
				reasoning: { effort: "low" },
			},
		},
		maxOutputTokens: 8000,
		experimental_telemetry: {
			isEnabled: true,
			functionId: "generate-resume-template.requestSlots",
		},
		messages: [
			{
				role: "user",
				content: [
					{
						type: "text",
						text: `Source file: ${input.filename}

${sourceLayoutBrief({
	sourcePageCount: input.sourcePageCount,
	attachedPages: input.pageParts.length,
})}

Read the page image(s) and return sampleData for every visible slot.${
							input.extractedLinks
								? `\n\n${input.extractedLinks}\n\nMap these into sampleData: github / linkedin / website as host/path, project url or links[].url when they belong to a project.`
								: ""
						}${
							input.retryHint
								? "\n\nYour previous reply had an empty sampleData. Fill it with the real resume content — do not return {}."
								: ""
						}`,
					},
					...input.pageParts,
				],
			},
		],
	});

	const parsed = extractJsonObject(result.text);
	logger.log("requestSlots raw result", {
		finishReason: result.finishReason,
		outputTokens: result.usage.outputTokens,
		sampleKeys: Object.keys(
			(parsed.sampleData as Record<string, unknown> | undefined) ?? {},
		),
	});

	return generatedSlotsSchema.parse(parsed);
}

async function requestHtml(input: {
	filename: string;
	pageParts: FilePart[];
	sourcePageCount: number;
	schema: Record<string, unknown>;
	sampleData: Record<string, unknown>;
}) {
	const { output } = await generateText({
		model: visionModel(),
		output: Output.object({ schema: generatedHtmlSchema }),
		instructions: DRAFT_HTML_INSTRUCTIONS,
		messages: [
			{
				role: "user",
				content: [
					{
						type: "text",
						text: `Source file: ${input.filename}

${sourceLayoutBrief({
	sourcePageCount: input.sourcePageCount,
	attachedPages: input.pageParts.length,
})}

Bind Handlebars to these schema paths only.

schema:
${JSON.stringify(input.schema)}

sampleData:
${JSON.stringify(input.sampleData)}`,
					},
					...input.pageParts,
				],
			},
		],
	});

	return generatedHtmlSchema.parse(output);
}

async function draftTemplate(input: {
	filename: string;
	pageParts: FilePart[];
	sourcePageCount: number;
	extractedLinks?: string;
}): Promise<GeneratedTemplate> {
	let slots = await requestSlots(input);
	if (Object.keys(slots.sampleData).length === 0) {
		logger.warn("slots pass returned empty sampleData; retrying");
		slots = await requestSlots({ ...input, retryHint: true });
	}
	if (Object.keys(slots.sampleData).length === 0) {
		throw new Error(
			"Model returned no sampleData after retry. Could not derive a template schema.",
		);
	}
	const sampleData = slots.sampleData;
	const schema = jsonSchemaFromSampleData(sampleData);

	logger.log("draft slots ready", {
		schemaKeys: Object.keys(schema.properties ?? {}),
		sampleKeys: Object.keys(sampleData),
	});

	const htmlDraft = await requestHtml({
		...input,
		schema,
		sampleData,
	});

	return {
		name: slots.name,
		description: slots.description,
		notes: slots.notes,
		html: htmlDraft.html,
		schema,
		sampleData,
	};
}

function applyDraft(generated: GeneratedTemplate): Draft {
	const html = sanitizeTemplateHtml(generated.html);
	const documentSchema = zodFromStoredSchema(generated.schema, {
		strict: true,
	});
	const sampleData = parseWithZod(documentSchema, generated.sampleData);
	return {
		name: generated.name,
		description: generated.description || "",
		notes: generated.notes,
		html,
		inputSchema: jsonSchemaFromZod(documentSchema),
		sampleData,
	};
}

async function renderPreview(input: {
	html: string;
	sampleData: Record<string, unknown>;
}) {
	const previewHtml = renderHandlebarsHtml(input.html, input.sampleData);
	return compileHtmlToPdfAndPng(previewHtml);
}

async function evaluateAndRevise(input: {
	pageParts: FilePart[];
	draft: Draft;
	previewPng: Buffer;
	sourcePageCount: number;
}) {
	const { output } = await generateText({
		model: visionModel(),
		output: Output.object({ schema: evaluationSchema }),
		instructions: `You QA a resume HTML template against the original page image(s).

This is the only refine pass — return your best revisedHtml now if anything high-impact is off.
Ignore tiny pixel nits (a few px of font/weight drift). Fix real structure problems:
- wrong page count vs the source
- leftover whitespace or overflow that does not match how full the source pages are
- font sizes that are clearly larger or smaller than the source
- wrong columns / section order
- missing or extra dividers
- big margin/spacing drift that shifts whole sections
- header structure mismatches
- color / rule mistakes

Especially fix cumulative vertical spacing: if later sections sit too low or spill onto an extra page, tighten section gaps, header padding, font sizes, and line-height to match the source density.

Return a single JSON object:
- matchScore: 0-100 overall visual fidelity (90+ = clearly the same design with only minor polish left)
- done: true if the design is close enough (same structure/look; small spacing/font variance OK)
- differences: up to 5 highest-impact mismatches (short strings)
- revisedHtml: full HTML document with the best practical fixes, or null if nothing worth changing
- revisedNotes / revisedSampleData / revisedSchema: only when needed for the layout; otherwise null

Rules:
- Prefer one solid CSS spacing/type-scale pass over endless micro-edits.
- Keep the existing Handlebars bindings. No JS/Tailwind CDN/scripts. A4 print CSS.
- Keep @page margin at least 12mm on every side. Do not set @page margin to 0. Body/page padding is not enough for page 2+.
- Do not invent new data fields or interpolate whole objects ({{this}}, {{bullets}}).
- Keep date ranges as one \`dates\` string slot. Do not split into startDate/endDate or add a date helper.
- Prose in sampleData is inline HTML (<strong>, <em>, <a href>), not markdown. Bind {{name}} not {{header.name}}.
- If you revise sampleData or schema, keep them in sync with the Handlebars bindings.
- If you revise, return the complete html document.`,
		messages: [
			{
				role: "user",
				content: [
					{
						type: "text",
						text: `${sourceLayoutBrief({
	sourcePageCount: input.sourcePageCount,
	attachedPages: input.pageParts.length,
})}

ORIGINAL page image(s) first, then GENERATED preview. Current HTML:\n\n${input.draft.html.slice(0, 60_000)}`,
					},
					...input.pageParts,
					{
						type: "text",
						text: "GENERATED preview PNG:",
					},
					{
						type: "file",
						mediaType: "image/png",
						filename: "generated-preview.png",
						data: input.previewPng,
					},
					{
						type: "text",
						text: `Current sampleData:\n${JSON.stringify(input.draft.sampleData)}\n\nCurrent notes:\n${input.draft.notes}`,
					},
				],
			},
		],
	});

	return evaluationSchema.parse(output);
}

async function publishReadyTemplate(input: {
	templateId: string;
	userId: string;
	draft: Draft;
	previewPng: Buffer;
	previewPdf: Buffer;
}) {
	const safeName =
		input.draft.name.replace(/[^\w\s.-]+/g, "").trim() || "template";
	const previewKey = `users/${input.userId}/templates/${input.templateId}/preview.png`;
	const previewPdfKey = customTemplatePreviewPdfKey(
		input.userId,
		input.templateId,
	);

	await Promise.all([
		putR2Object({
			key: previewKey,
			body: input.previewPng,
			contentType: "image/png",
		}),
		putR2Object({
			key: previewPdfKey,
			body: input.previewPdf,
			contentType: "application/pdf",
		}),
	]);

	const [previewFile, previewPdfFile] = await Promise.all([
		insertUserFileRow({
			id: nanoid(),
			userId: input.userId,
			key: previewKey,
			filename: `${safeName}-preview.png`,
			contentType: "image/png",
			size: input.previewPng.byteLength,
		}),
		insertUserFileRow({
			id: nanoid(),
			userId: input.userId,
			key: previewPdfKey,
			filename: `${safeName}-preview.pdf`,
			contentType: "application/pdf",
			size: input.previewPdf.byteLength,
		}),
	]);

	return updateResumeTemplateForUser(input.templateId, input.userId, {
		name: input.draft.name,
		description: input.draft.description,
		notes: input.draft.notes,
		inputSchema: input.draft.inputSchema,
		html: input.draft.html,
		previewFileId: previewFile.id,
		previewPdfFileId: previewPdfFile.id,
		status: "ready",
		error: null,
	});
}

export const generateResumeTemplate = schemaTask({
	id: "generate-resume-template",
	schema: z.object({
		templateId: z.string().min(1),
		userId: z.string().min(1),
	}),
	retry: {
		maxAttempts: 2,
	},
	run: async (payload) => {
		const row = await getResumeTemplateForUser(
			payload.templateId,
			payload.userId,
		);
		if (!row) {
			throw new Error("Template not found");
		}
		if (!row.sourceFileId) {
			throw new Error("Template is missing a source file");
		}

		let published = row.status === "ready" && Boolean(row.html);
		if (!published) {
			await updateResumeTemplateForUser(payload.templateId, payload.userId, {
				status: "drafting",
				error: null,
			});
		} else {
			await updateResumeTemplateForUser(payload.templateId, payload.userId, {
				error: null,
			});
		}

		try {
			const source = await loadSourcePageImages({
				userId: payload.userId,
				fileId: row.sourceFileId,
			});
			const pageParts = pageImageParts(source.pages);
			const extractedLinks =
				source.mediaType === "application/pdf"
					? formatPdfLinksForModel(
							extractPdfLinks(source.bytes),
							source.filename,
						)
					: "";

			logger.log("rasterized source for template generation", {
				templateId: payload.templateId,
				filename: source.filename,
				mediaType: source.mediaType,
				pageCount: source.pages.length,
				sourcePageCount: source.sourcePageCount,
			});

			let draft = applyDraft(
				await draftTemplate({
					filename: source.filename,
					pageParts,
					sourcePageCount: source.sourcePageCount,
					extractedLinks,
				}),
			);
			let preview = await renderPreview(draft);

			await publishReadyTemplate({
				templateId: payload.templateId,
				userId: payload.userId,
				draft,
				previewPng: preview.png,
				previewPdf: preview.pdf,
			});
			published = true;

			logger.log("published first draft for selection", {
				templateId: payload.templateId,
			});

			let matchScore = 0;
			let differences: string[] = [];
			let appliedRevision = false;

			for (let attempt = 1; attempt <= REFINE_ATTEMPTS; attempt++) {
				try {
					const evaluation = await evaluateAndRevise({
						pageParts,
						draft,
						previewPng: preview.png,
						sourcePageCount: source.sourcePageCount,
					});

					logger.log("template refine evaluation", {
						templateId: payload.templateId,
						attempt,
						matchScore: evaluation.matchScore,
						done: evaluation.done,
						differences: evaluation.differences,
					});

					matchScore = evaluation.matchScore;
					differences = evaluation.differences;

					const stopEarly =
						evaluation.done || evaluation.matchScore >= EARLY_STOP_SCORE;
					const revisedHtml = evaluation.revisedHtml;

					if (!stopEarly && revisedHtml != null) {
						let sampleData = draft.sampleData;
						let inputSchema = draft.inputSchema;
						try {
							if (
								evaluation.revisedSchema &&
								!isEmptyDocumentSchema(evaluation.revisedSchema)
							) {
								const documentSchema = zodFromStoredSchema(
									evaluation.revisedSchema,
									{ strict: true },
								);
								inputSchema = jsonSchemaFromZod(documentSchema);
								if (evaluation.revisedSampleData) {
									sampleData = parseWithZod(
										documentSchema,
										evaluation.revisedSampleData,
									);
								} else {
									sampleData = parseWithZod(
										documentSchema,
										draft.sampleData,
									);
								}
							} else if (evaluation.revisedSampleData) {
								sampleData = parseWithZod(
									zodFromStoredSchema(inputSchema, { strict: true }),
									evaluation.revisedSampleData,
								);
							}
						} catch {
							sampleData = draft.sampleData;
							inputSchema = draft.inputSchema;
						}
						draft = {
							...draft,
							html: sanitizeTemplateHtml(revisedHtml),
							sampleData,
							inputSchema,
							notes: evaluation.revisedNotes ?? draft.notes,
						};
						preview = await renderPreview(draft);
						appliedRevision = true;
					}

					await publishReadyTemplate({
						templateId: payload.templateId,
						userId: payload.userId,
						draft,
						previewPng: preview.png,
						previewPdf: preview.pdf,
					});

					logger.log("keeping best template draft", {
						templateId: payload.templateId,
						matchScore,
						differences,
						appliedRevision,
					});
					break;
				} catch (error) {
					logger.log("template refine attempt failed", {
						templateId: payload.templateId,
						attempt,
						error: error instanceof Error ? error.message : "unknown",
					});
					if (attempt === REFINE_ATTEMPTS) {
						logger.log("refine exhausted, keeping first draft", {
							templateId: payload.templateId,
						});
					}
				}
			}

			return {
				templateId: payload.templateId,
				status: "ready",
				matchScore,
				differences,
				appliedRevision,
			};
		} catch (error) {
			if (!published) {
				const message =
					error instanceof Error
						? error.message.slice(0, 2000)
						: "Template generation failed";
				await updateResumeTemplateForUser(payload.templateId, payload.userId, {
					status: "failed",
					error: message,
				});
			}
			throw error;
		}
	},
});
