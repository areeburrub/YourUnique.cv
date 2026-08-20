import type { BuiltinTemplateSource } from "../types";
import { notes } from "./notes";
import { sampleData } from "./sample-data";
import { documentSchema } from "./schema";
import { html } from "./template";

export const classicSerif = {
	id: "classic-serif",
	name: "Classic Serif",
	description:
		"Traditional single-column A4 resume with Computer Modern type and small-caps section rules.",
	folder: "classic-serif",
	html,
	notes,
	documentSchema,
	sampleData: sampleData as Record<string, unknown>,
	previewPath: "/templates/builtins/classic-serif/preview.png",
	previewPdfPath: "/templates/builtins/classic-serif/preview.pdf",
	category: "Professional",
	colors: ["#111111", "#000080", "#333333"],
	formats: ["PDF"],
	styleLabel: "Serif",
} satisfies BuiltinTemplateSource;
