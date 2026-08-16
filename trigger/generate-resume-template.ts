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
import { renderHandlebarsHtml } from "@/lib/resume-templates/handlebars";
import { customTemplatePreviewPdfKey } from "@/lib/resume-templates/registry";
import { rasterizeSourceFile } from "@/lib/resume-templates/rasterize-source";
import { sanitizeTemplateHtml } from "@/lib/resume-templates/sanitize-html";
import { validateAgainstJsonSchema } from "@/lib/resume-templates/validate";
import {
	compileHtmlToPdf,
	compileHtmlToPng,
} from "@/trigger/lib/playwright-html";

const MAX_REFINE_ROUNDS = 2;
const EARLY_STOP_SCORE = 90;

const generatedTemplateSchema = z.object({
	name: z.string().min(1).max(80),
	description: z.string().max(240),
	notes: z.string().min(1),
	inputSchema: z.record(z.string(), z.unknown()),
	html: z.string().min(1),
	sampleData: z.record(z.string(), z.unknown()),
});

const evaluationSchema = z.object({
	matchScore: z.number().min(0).max(100),
	done: z.boolean(),
	differences: z.array(z.string()),
	revisedHtml: z.string().nullable(),
	revisedNotes: z.string().nullable(),
	revisedInputSchema: z.record(z.string(), z.unknown()).nullable(),
	revisedSampleData: z.record(z.string(), z.unknown()).nullable(),
});

type GeneratedTemplate = z.infer<typeof generatedTemplateSchema>;

type Draft = {
	name: string;
	description: string;
	notes: string;
	html: string;
	inputSchema: Record<string, unknown>;
	sampleData: Record<string, unknown>;
};

function visionModel() {
	return openrouter("openai/gpt-5.6-luna");
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
	const pages = await rasterizeSourceFile({
		bytes,
		mediaType: file.contentType,
		filename: file.filename,
	});

	return {
		filename: file.filename,
		mediaType: file.contentType,
		pages,
	};
}

async function draftTemplate(input: {
	filename: string;
	pageParts: FilePart[];
}) {
	const { output } = await generateText({
		model: visionModel(),
		output: Output.json(),
		instructions: `You reverse-engineer a printable A4 resume HTML/CSS template from page image(s) of a user's uploaded resume.

Reproduce the uploaded design closely: same section order, header layout, columns, rules/dividers, colors, and overall spacing rhythm. Aim for a faithful HTML/CSS clone, not a generic resume.

Return a single JSON object (not a string, not markdown) with these keys:
- name: short template name (string)
- description: one sentence (string)
- notes: markdown instructions for a resume agent filling THIS template's inputSchema (field rules, nesting, what to omit). No global schema assumptions. Tell the agent that prose fields (summary, bullets, descriptions) may use inline **bold**, *italic*, and [label](https://url); the renderer turns those into emphasis and links. Do not allow HTML, Typst, or LaTeX in JSON strings. Do not say "plain text only". Do not use triple-stash {{{value}}} for user text.
- inputSchema: a JSON Schema object (draft 2020-12 style) describing ONLY the fields this layout needs. Must be a nested object, not a string.
- html: a complete HTML document (DOCTYPE + html) with embedded CSS for A4 print (@page size A4; margin 0). Use Handlebars mustache tags bound to inputSchema paths. No JavaScript, no Tailwind CDN, no external scripts. Prefer Google Fonts / jsDelivr font links matching the uploaded look.
- sampleData: fixture document matching inputSchema. Copy the original resume's visible text, bullet counts, and section density so the preview lines up with the source.

Rules:
- Match structure first: margins, columns, header, section order, dividers, colors.
- Keep vertical spacing tight and intentional — avoid extra padding that pushes later sections down the page.
- One A4 page target unless the source clearly has more pages.
- print CSS only. No script tags or event handlers.
- Handlebars {{value}} interpolations HTML-escape first, then render inline **bold**, *italic*, and [label](url) from JSON strings. Use {{value}}, not triple-stash, for user text.`,
		messages: [
			{
				role: "user",
				content: [
					{
						type: "text",
						text: `Source file: ${input.filename}

Clone this resume design in HTML/CSS + Handlebars. Reuse the visible text in sampleData so spacing can be judged fairly.`,
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
	const inputSchema = generated.inputSchema;
	const sampleData = validateAgainstJsonSchema(
		inputSchema,
		generated.sampleData,
	);
	return {
		name: generated.name,
		description: generated.description || "",
		notes: generated.notes,
		html,
		inputSchema,
		sampleData,
	};
}

async function renderPreviewPng(input: {
	html: string;
	sampleData: Record<string, unknown>;
}) {
	const previewHtml = renderHandlebarsHtml(input.html, input.sampleData);
	return compileHtmlToPng(previewHtml);
}

async function evaluateAndRevise(input: {
	pageParts: FilePart[];
	draft: Draft;
	previewPng: Buffer;
	round: number;
}) {
	const { output } = await generateText({
		model: visionModel(),
		output: Output.json(),
		instructions: `You QA a resume HTML template against the original page image(s).

Focus on high-impact layout fixes only (max ${MAX_REFINE_ROUNDS} refine rounds — this is round ${input.round}).
Ignore tiny pixel nits (a few px of font/weight drift). Fix real structure problems:
- wrong columns / section order
- missing or extra dividers
- big margin/spacing drift that shifts whole sections
- header structure mismatches
- color / rule mistakes

Especially fix cumulative vertical spacing: if later sections sit too low, tighten section gaps, header padding, and line-height — do not leave progressive downward drift.

Return a single JSON object:
- matchScore: 0-100 overall visual fidelity (90+ = clearly the same design with only minor polish left)
- done: true if the design is close enough (same structure/look; small spacing/font variance OK)
- differences: up to 5 highest-impact mismatches (short strings)
- revisedHtml: full HTML document with the best practical fixes, or null if nothing worth changing
- revisedNotes / revisedInputSchema / revisedSampleData: only when needed for the layout; otherwise null

Rules:
- Prefer one solid CSS spacing/layout pass over endless micro-edits.
- Keep Handlebars bindings. No JS/Tailwind CDN/scripts. A4 print CSS.
- If you revise, return the complete html document.`,
		messages: [
			{
				role: "user",
				content: [
					{
						type: "text",
						text: `ORIGINAL page image(s) first, then GENERATED preview. Current HTML:\n\n${input.draft.html.slice(0, 60_000)}`,
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
						text: `Current inputSchema:\n${JSON.stringify(input.draft.inputSchema)}\n\nCurrent sampleData:\n${JSON.stringify(input.draft.sampleData)}\n\nCurrent notes:\n${input.draft.notes}`,
					},
				],
			},
		],
	});

	return evaluationSchema.parse(output);
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

		await updateResumeTemplateForUser(payload.templateId, payload.userId, {
			status: "drafting",
			error: null,
		});

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
			});

			let draft = applyDraft(
				await draftTemplate({
					filename: source.filename,
					pageParts,
				}),
			);
			let previewPng = await renderPreviewPng(draft);

			let best = {
				draft,
				previewPng,
				matchScore: 0,
				differences: [] as string[],
			};

			for (let round = 1; round <= MAX_REFINE_ROUNDS; round++) {
				const evaluation = await evaluateAndRevise({
					pageParts,
					draft,
					previewPng,
					round,
				});

				logger.log("template refine evaluation", {
					templateId: payload.templateId,
					round,
					matchScore: evaluation.matchScore,
					done: evaluation.done,
					differences: evaluation.differences,
				});

				if (evaluation.matchScore >= best.matchScore) {
					best = {
						draft,
						previewPng,
						matchScore: evaluation.matchScore,
						differences: evaluation.differences,
					};
				}

				const stopEarly =
					evaluation.done || evaluation.matchScore >= EARLY_STOP_SCORE;
				const revisedHtml = evaluation.revisedHtml;
				const canRevise = revisedHtml != null && round < MAX_REFINE_ROUNDS;

				if (stopEarly || !canRevise) {
					break;
				}

				const nextInputSchema =
					evaluation.revisedInputSchema ?? draft.inputSchema;
				draft = {
					...draft,
					html: sanitizeTemplateHtml(revisedHtml),
					inputSchema: nextInputSchema,
					sampleData: validateAgainstJsonSchema(
						nextInputSchema,
						evaluation.revisedSampleData ?? draft.sampleData,
					),
					notes: evaluation.revisedNotes ?? draft.notes,
				};
				previewPng = await renderPreviewPng(draft);
			}

			draft = best.draft;
			previewPng = best.previewPng;

			logger.log("keeping best template draft", {
				templateId: payload.templateId,
				matchScore: best.matchScore,
				differences: best.differences,
			});

			const safeName =
				draft.name.replace(/[^\w\s.-]+/g, "").trim() || "template";
			const previewHtml = renderHandlebarsHtml(draft.html, draft.sampleData);
			const previewPdf = await compileHtmlToPdf(previewHtml);

			const previewKey = `users/${payload.userId}/templates/${payload.templateId}/preview.png`;
			const previewPdfKey = customTemplatePreviewPdfKey(
				payload.userId,
				payload.templateId,
			);
			await Promise.all([
				putR2Object({
					key: previewKey,
					body: previewPng,
					contentType: "image/png",
				}),
				putR2Object({
					key: previewPdfKey,
					body: previewPdf,
					contentType: "application/pdf",
				}),
			]);

			const [previewFile, previewPdfFile] = await Promise.all([
				insertUserFileRow({
					id: nanoid(),
					userId: payload.userId,
					key: previewKey,
					filename: `${safeName}-preview.png`,
					contentType: "image/png",
					size: previewPng.byteLength,
				}),
				insertUserFileRow({
					id: nanoid(),
					userId: payload.userId,
					key: previewPdfKey,
					filename: `${safeName}-preview.pdf`,
					contentType: "application/pdf",
					size: previewPdf.byteLength,
				}),
			]);

			const updated = await updateResumeTemplateForUser(
				payload.templateId,
				payload.userId,
				{
					name: draft.name,
					description: draft.description,
					notes: draft.notes,
					inputSchema: draft.inputSchema,
					html: draft.html,
					previewFileId: previewFile.id,
					previewPdfFileId: previewPdfFile.id,
					status: "ready",
					error: null,
				},
			);

			return {
				templateId: payload.templateId,
				status: updated?.status ?? "ready",
				matchScore: best.matchScore,
				differences: best.differences,
			};
		} catch (error) {
			const message =
				error instanceof Error
					? error.message.slice(0, 2000)
					: "Template generation failed";
			await updateResumeTemplateForUser(payload.templateId, payload.userId, {
				status: "failed",
				error: message,
			});
			throw error;
		}
	},
});
