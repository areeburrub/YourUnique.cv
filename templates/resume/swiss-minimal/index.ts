import type { BuiltinTemplateSource } from "../types";
import { notes } from "./notes";
import { sampleData } from "./sample-data";
import { documentSchema } from "./schema";
import { html } from "./template";

export const swissMinimal = {
	id: "swiss-minimal",
	name: "Swiss Minimal",
	description:
		"Airy Helvetica-style page with wide-tracked headings and hairline rules. A common pick for product and design roles.",
	folder: "swiss-minimal",
	html,
	notes,
	documentSchema,
	sampleData: sampleData as Record<string, unknown>,
	previewPath: "/templates/builtins/swiss-minimal/preview.png",
	previewPdfPath: "/templates/builtins/swiss-minimal/preview.pdf",
	category: "Modern",
	colors: ["#111111", "#6b7280", "#e5e7eb"],
	formats: ["PDF"],
	styleLabel: "Sans",
} satisfies BuiltinTemplateSource;
