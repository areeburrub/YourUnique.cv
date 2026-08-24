import type { BuiltinTemplateSource } from "../types";
import { notes } from "./notes";
import { sampleData } from "./sample-data";
import { documentSchema } from "./schema";
import { html } from "./template";

export const slateSidebar = {
	id: "slate-sidebar",
	name: "Slate Sidebar",
	description:
		"Two-column page with a dark left rail for contact and skills, and a light main column for experience.",
	folder: "slate-sidebar",
	html,
	notes,
	documentSchema,
	sampleData: sampleData as Record<string, unknown>,
	previewPath: "/templates/builtins/slate-sidebar/preview.png",
	previewPdfPath: "/templates/builtins/slate-sidebar/preview.pdf",
	category: "Modern",
	colors: ["#1e293b", "#0f172a", "#94a3b8"],
	formats: ["PDF"],
	styleLabel: "Sans",
} satisfies BuiltinTemplateSource;
