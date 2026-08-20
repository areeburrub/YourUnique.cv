import { logger, schemaTask } from "@trigger.dev/sdk";
import { nanoid } from "nanoid";
import { z } from "zod";

import { insertUserFileRow } from "@/lib/db/files";
import {
	getLatestResumeDocumentForTemplateRef,
	listResumesForUserByTemplateRef,
} from "@/lib/db/resumes";
import {
	getResumeTemplateForUser,
	updateResumeTemplateForUser,
} from "@/lib/db/templates";
import { putR2Object } from "@/lib/r2";
import { queueResumeCompile } from "@/lib/resume-compile";
import { renderHandlebarsHtml } from "@/lib/resume-templates/handlebars";
import { applyTemplateHtmlPatches } from "@/lib/resume-templates/html-patch";
import { isEmptyDocumentSchema, placeholderDataFromSchema } from "@/lib/resume-templates/parse";
import { applyResumePatches, jsonPatchSchema } from "@/lib/resume-templates/patch";
import { customRef } from "@/lib/resume-templates/refs";
import { customTemplatePreviewPdfKey } from "@/lib/resume-templates/registry";
import { sanitizeTemplateHtml } from "@/lib/resume-templates/sanitize-html";
import { compileHtmlToPdfAndPng } from "@/trigger/lib/playwright-html";

export const patchResumeTemplate = schemaTask({
	id: "patch-resume-template",
	schema: z.object({
		templateId: z.string().min(1),
		userId: z.string().min(1),
		htmlPatches: z
			.array(
				z.object({
					find: z.string().min(1),
					replace: z.string(),
				}),
			)
			.optional(),
		schemaPatches: z.array(jsonPatchSchema).optional(),
	}),
	retry: {
		maxAttempts: 1,
	},
	run: async (payload) => {
		const row = await getResumeTemplateForUser(
			payload.templateId,
			payload.userId,
		);
		if (!row) {
			throw new Error("Template not found");
		}
		if (row.status !== "ready") {
			throw new Error(
				`Template is not ready to edit (status: ${row.status}${row.error ? `: ${row.error}` : ""})`,
			);
		}
		if (!payload.htmlPatches?.length && !payload.schemaPatches?.length) {
			throw new Error("At least one of htmlPatches or schemaPatches is required");
		}

		let nextInputSchema = row.inputSchema ?? {};
		if (payload.schemaPatches?.length) {
			try {
				nextInputSchema = applyResumePatches(
					nextInputSchema,
					payload.schemaPatches,
				);
			} catch (error) {
				const message = error instanceof Error ? error.message : "failed";
				throw new Error(`Schema patch failed: ${message}`);
			}
			if (isEmptyDocumentSchema(nextInputSchema)) {
				throw new Error(
					"Schema patch failed: result has no properties. Did you patch the wrong path (e.g. missing a leading /properties)?",
				);
			}
		}

		const patchedHtml = payload.htmlPatches?.length
			? sanitizeTemplateHtml(
					applyTemplateHtmlPatches(row.html, payload.htmlPatches),
				)
			: row.html;

		const sampleData =
			(await getLatestResumeDocumentForTemplateRef(
				payload.userId,
				customRef(payload.templateId),
			)) ?? placeholderDataFromSchema(nextInputSchema);

		let previewHtml: string;
		try {
			previewHtml = renderHandlebarsHtml(patchedHtml, sampleData);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Handlebars render failed";
			throw new Error(
				`Patched HTML failed to render: ${message}. Bindings must still match the existing schema paths — do not rename or remove a bound field.`,
			);
		}

		const { pdf, png } = await compileHtmlToPdfAndPng(previewHtml);

		const safeName = row.name.replace(/[^\w\s.-]+/g, "").trim() || "template";
		const previewKey = `users/${payload.userId}/templates/${payload.templateId}/preview.png`;
		const previewPdfKey = customTemplatePreviewPdfKey(
			payload.userId,
			payload.templateId,
		);

		await Promise.all([
			putR2Object({ key: previewKey, body: png, contentType: "image/png" }),
			putR2Object({
				key: previewPdfKey,
				body: pdf,
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
				size: png.byteLength,
			}),
			insertUserFileRow({
				id: nanoid(),
				userId: payload.userId,
				key: previewPdfKey,
				filename: `${safeName}-preview.pdf`,
				contentType: "application/pdf",
				size: pdf.byteLength,
			}),
		]);

		const updated = await updateResumeTemplateForUser(
			payload.templateId,
			payload.userId,
			{
				html: patchedHtml,
				inputSchema: nextInputSchema,
				previewFileId: previewFile.id,
				previewPdfFileId: previewPdfFile.id,
				status: "ready",
				error: null,
			},
		);
		if (!updated) {
			throw new Error("Template not found");
		}

		const affectedResumes = await listResumesForUserByTemplateRef(
			payload.userId,
			customRef(payload.templateId),
		);
		const recompiledResumeIds: string[] = [];
		for (const resume of affectedResumes) {
			try {
				await queueResumeCompile({ resumeId: resume.id, userId: payload.userId });
				recompiledResumeIds.push(resume.id);
			} catch (error) {
				logger.error("failed to requeue resume compile after template patch", {
					templateId: payload.templateId,
					resumeId: resume.id,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		logger.log("patched resume template", {
			templateId: payload.templateId,
			htmlPatches: payload.htmlPatches?.length ?? 0,
			schemaPatches: payload.schemaPatches?.length ?? 0,
			usedRealSampleData: sampleData !== null,
			recompiledResumeIds,
		});

		return {
			templateId: payload.templateId,
			ok: true as const,
			recompiledResumeIds,
		};
	},
});
