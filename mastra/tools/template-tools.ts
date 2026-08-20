import { createTool } from "@mastra/core/tools";
import { runs, tasks } from "@trigger.dev/sdk";
import { z } from "zod";

import { getResumeForUser } from "@/lib/db/resumes";
import { getResumeTemplateForUser } from "@/lib/db/templates";
import { jsonPatchSchema } from "@/lib/resume-templates/patch";
import { resolveUserSelectedTemplate } from "@/lib/resume-templates/registry";
import { resumeLinkPayload } from "@/mastra/tools/resume-tools";
import type { patchResumeTemplate } from "@/trigger/patch-resume-template";

type ToolRequestContext = {
	get: (key: string) => unknown;
};

function requireUserId(requestContext: ToolRequestContext | undefined) {
	const userId = requestContext?.get("userId");
	if (typeof userId !== "string" || !userId) {
		throw new Error("Unauthorized");
	}
	return userId;
}

const NOT_CUSTOM_INSTRUCTION =
	"The user's current template is a built-in, shared template — it cannot be edited directly. Tell the user built-in templates are read-only and they need to upload their own resume file (which clones its design into an editable custom template) before design changes can be made.";

export const getTemplateSourceTool = createTool({
	id: "get_template_source",
	description:
		"Read the current custom template's raw HTML/CSS source, layout notes, and JSON schema so you can plan a design edit. Only works for custom templates (cloned from an uploaded resume) — built-in templates are read-only.",
	inputSchema: z.object({}),
	outputSchema: z.object({
		ok: z.boolean(),
		templateId: z.string().optional(),
		name: z.string().optional(),
		notes: z.string().optional(),
		inputSchema: z.record(z.string(), z.unknown()).optional(),
		html: z.string().optional(),
		instruction: z.string(),
	}),
	execute: async (_input, context) => {
		const userId = requireUserId(context?.requestContext);
		const template = await resolveUserSelectedTemplate(userId);
		if (template.kind !== "custom") {
			return { ok: false, instruction: NOT_CUSTOM_INSTRUCTION };
		}
		const row = await getResumeTemplateForUser(template.id, userId);
		if (!row) {
			throw new Error("Template not found");
		}
		return {
			ok: true,
			templateId: row.id,
			name: row.name,
			notes: row.notes,
			inputSchema: row.inputSchema ?? {},
			html: row.html,
			instruction:
				"To change layout/CSS/markup, call patch_template_html with htmlPatches — exact find/replace snippets copied from this html, do not resend the full document. Keep every existing {{...}} binding, {{#each}}/{{#if}} block, and helper call exactly as-is unless you are intentionally adding a brand-new section. To add a whole new section the current schema has no field for (e.g. a Certificates section), you CAN extend the schema: pass schemaPatches (JSON Pointer ops against this inputSchema, e.g. add /properties/certifications) together with htmlPatches that add matching {{#each certifications}}/{{#if certifications}}-guarded markup, in the same call. Any new property must be added as optional (omit it from /required) so resumes that don't have it yet keep rendering fine. Never rename or remove an existing bound field.",
		};
	},
});

const templateHtmlPatchSchema = z.object({
	find: z
		.string()
		.min(1)
		.describe(
			"Exact substring to find in the template HTML, copied verbatim from get_template_source. Must match exactly once — include enough surrounding context (a class name, a nearby tag) to make it unique.",
		),
	replace: z
		.string()
		.describe("Replacement text. Use an empty string to delete the matched text."),
});

export const patchTemplateHtmlTool = createTool({
	id: "patch_template_html",
	description:
		"Apply exact find/replace edits to the current custom template's HTML/CSS (layout, colors, spacing, fonts, section order, dividers, or adding a whole new section) and re-render its preview. Send only the snippets that change — never the full HTML document. To add a new section that needs a new data field (e.g. Certificates), also pass schemaPatches to extend the template's JSON schema in the same call — new fields must be optional. Otherwise keep all existing Handlebars bindings identical; this only edits markup/CSS/schema, not the resume content itself.",
	inputSchema: z.object({
		htmlPatches: z
			.array(templateHtmlPatchSchema)
			.optional()
			.describe("Ordered find/replace patches against the template HTML, applied in sequence."),
		schemaPatches: z
			.array(jsonPatchSchema)
			.optional()
			.describe(
				"Ordered JSON Pointer patches against the template's inputSchema, applied before htmlPatches. Only needed when adding/removing a data field (e.g. a new section).",
			),
	}),
	outputSchema: z.object({
		ok: z.boolean(),
		templateId: z.string(),
		recompiledResumeCount: z.number(),
		resumesPath: z.string(),
		previewUrl: z.string().optional(),
		downloadUrl: z.string().optional(),
		name: z.string().optional(),
		compileStatus: z.string().optional(),
		instruction: z.string(),
	}),
	execute: async (input, context) => {
		const userId = requireUserId(context?.requestContext);
		const template = await resolveUserSelectedTemplate(userId);
		if (template.kind !== "custom") {
			throw new Error(NOT_CUSTOM_INSTRUCTION);
		}
		if (!input.htmlPatches?.length && !input.schemaPatches?.length) {
			throw new Error("Provide htmlPatches, schemaPatches, or both.");
		}

		const handle = await tasks.trigger<typeof patchResumeTemplate>(
			"patch-resume-template",
			{
				templateId: template.id,
				userId,
				htmlPatches: input.htmlPatches,
				schemaPatches: input.schemaPatches,
			},
		);

		const run = await runs.poll<typeof patchResumeTemplate>(handle.id, {
			pollIntervalMs: 750,
		});

		if (!run.isSuccess) {
			const detail =
				run.error?.message?.slice(0, 1200) ??
				`Template patch run ended with status ${run.status}`;
			throw new Error(detail);
		}

		const recompiledResumeIds = run.output?.recompiledResumeIds ?? [];
		const recompiledResumeCount = recompiledResumeIds.length;

		// The most recently touched resume on this template is the one the
		// user is most likely to be talking about — surface that one as a PDF
		// card. The card itself polls compileStatus client-side, so we don't
		// need to wait for the recompile to finish here.
		const primaryResumeId = recompiledResumeIds[0];
		const primaryResume = primaryResumeId
			? await getResumeForUser(primaryResumeId, userId)
			: null;

		const schemaNote = input.schemaPatches?.length
			? " The template's schema was extended with new field(s) via schemaPatches — the resume's actual data still needs those field(s) filled in (that is resume-agent's job, not yours: hand off by clearly stating the new field name(s) and shape so the content can be added next)."
			: "";

		if (primaryResume) {
			return {
				ok: true,
				templateId: template.id,
				recompiledResumeCount,
				...resumeLinkPayload(primaryResume),
				instruction: `The design change is saved. A PDF card for this resume will render automatically in chat and will flip to ready once it finishes regenerating (usually a few seconds) — do not add another link or tell the user to check the resumes page separately. Just briefly describe what changed.${schemaNote}`,
			};
		}

		return {
			ok: true,
			templateId: template.id,
			recompiledResumeCount,
			resumesPath: "/resumes",
			instruction: `The design change is saved on the template. No existing resumes use this template yet, so there is nothing to recompile or show — just briefly describe what changed.${schemaNote}`,
		};
	},
});

export const getSelectedTemplateKindTool = createTool({
	id: "get_selected_template_kind",
	description:
		"Check whether the user's currently selected template is a builtin (read-only) or custom (editable) template, before attempting any design edit.",
	inputSchema: z.object({}),
	outputSchema: z.object({
		kind: z.enum(["builtin", "custom"]),
		templateId: z.string(),
		name: z.string(),
		instruction: z.string(),
	}),
	execute: async (_input, context) => {
		const userId = requireUserId(context?.requestContext);
		const template = await resolveUserSelectedTemplate(userId);
		return {
			kind: template.kind,
			templateId: template.id,
			name: template.name,
			instruction:
				template.kind === "custom"
					? "Editable. Call get_template_source next."
					: NOT_CUSTOM_INSTRUCTION,
		};
	},
});

