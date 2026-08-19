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
import { putR2Object, getR2Object } from "@/lib/r2";
import {
	parseResumeDocument,
	resumeDocumentJsonSchema,
	resumeDocumentSchema,
} from "@/lib/resume-templates/document-schema";
import { renderHandlebarsHtml } from "@/lib/resume-templates/handlebars";
import { customTemplatePreviewPdfKey } from "@/lib/resume-templates/registry";
import { rasterizeSourceFile } from "@/lib/resume-templates/rasterize-source";
import { sanitizeTemplateHtml } from "@/lib/resume-templates/sanitize-html";
import { DRAFT_TEMPLATE_INSTRUCTIONS } from "@/lib/resume-templates/template-draft-prompt";
import { compileHtmlToPdfAndPng } from "@/trigger/lib/playwright-html";

const TEMPLATE_VISION_MODEL = "google/gemini-3.7-flash";
const EARLY_STOP_SCORE = 90;
const REFINE_ATTEMPTS = 2;

const generatedTemplateSchema = z.object({
	name: z.string().min(1).max(80),
	description: z.string().max(240),
	notes: z.string().min(1),
	html: z.string().min(1),
	sampleData: resumeDocumentSchema,
});

const evaluationSchema = z.object({
	matchScore: z.number().min(0).max(100),
	done: z.boolean(),
	differences: z.array(z.string()),
	revisedHtml: z.string().nullable(),
	revisedNotes: z.string().nullable(),
	revisedSampleData: resumeDocumentSchema.nullable(),
});

type GeneratedTemplate = z.infer<typeof generatedTemplateSchema>;

type Draft = {
	name: string;
	description: string;
	notes: string;
	html: string;
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

async function draftTemplate(input: {
	filename: string;
	pageParts: FilePart[];
	sourcePageCount: number;
}) {
	const { output } = await generateText({
		model: visionModel(),
		output: Output.object({ schema: generatedTemplateSchema }),
		instructions: DRAFT_TEMPLATE_INSTRUCTIONS,
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

Clone this resume design in HTML/CSS + Handlebars. Reuse the visible text in sampleData so spacing can be judged fairly.
Bind only the canonical document paths (experience[].roles[], {{dateRange startDate endDate}}, bullets as {{text}}, skills.items as a string). Do not invent a schema or interpolate whole objects.`,
					},
					...input.pageParts,
				],
			},
		],
	});

	return generatedTemplateSchema.parse(output);
}

function applyDraft(generated: GeneratedTemplate): Draft {
	const html = sanitizeTemplateHtml(generated.html);
	const sampleData = parseResumeDocument(generated.sampleData);
	return {
		name: generated.name,
		description: generated.description || "",
		notes: generated.notes,
		html,
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
- revisedNotes / revisedSampleData: only when needed for the layout; otherwise null

Rules:
- Prefer one solid CSS spacing/type-scale pass over endless micro-edits.
- Keep the existing Handlebars bindings. No JS/Tailwind CDN/scripts. A4 print CSS.
- Keep @page margin at least 12mm on every side. Do not set @page margin to 0. Body/page padding is not enough for page 2+.
- Do not invent new data fields or interpolate whole objects ({{this}}, {{bullets}}).
- If you revise sampleData, keep the canonical document shape.
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
		inputSchema: resumeDocumentJsonSchema,
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
						if (evaluation.revisedSampleData) {
							try {
								sampleData = parseResumeDocument(
									evaluation.revisedSampleData,
								);
							} catch {
								sampleData = draft.sampleData;
							}
						}
						draft = {
							...draft,
							html: sanitizeTemplateHtml(revisedHtml),
							sampleData,
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
