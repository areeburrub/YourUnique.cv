import type { BuiltinTemplateSource } from "../types";
import { notes } from "./notes";
import { sampleData } from "./sample-data";
import { documentSchema } from "./schema";
import { html } from "./template";

export const engineeringCompact = {
	id: "engineering-compact",
	name: "Engineering Compact",
	description:
		"The popular SWE layout: centered small-caps name, pipe-separated contact, and tight single-column rules.",
	folder: "engineering-compact",
	html,
	notes,
	documentSchema,
	sampleData: sampleData as Record<string, unknown>,
	previewPath: "/templates/builtins/engineering-compact/preview.png",
	previewPdfPath: "/templates/builtins/engineering-compact/preview.pdf",
	category: "Tech",
	colors: ["#111111", "#222222", "#555555"],
	formats: ["PDF"],
	styleLabel: "Sans",
} satisfies BuiltinTemplateSource;
