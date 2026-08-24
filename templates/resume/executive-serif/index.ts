import type { BuiltinTemplateSource } from "../types";
import { notes } from "./notes";
import { sampleData } from "./sample-data";
import { documentSchema } from "./schema";
import { html } from "./template";

export const executiveSerif = {
	id: "executive-serif",
	name: "Executive Serif",
	description:
		"Conservative senior layout: large name, gold rule, and title-first experience rows.",
	folder: "executive-serif",
	html,
	notes,
	documentSchema,
	sampleData: sampleData as Record<string, unknown>,
	previewPath: "/templates/builtins/executive-serif/preview.png",
	previewPdfPath: "/templates/builtins/executive-serif/preview.pdf",
	category: "Executive",
	colors: ["#1a1a1a", "#b08d57", "#4a4a4a"],
	formats: ["PDF"],
	styleLabel: "Serif",
} satisfies BuiltinTemplateSource;
