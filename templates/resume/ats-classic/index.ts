import type { BuiltinTemplateSource } from "../types";
import { notes } from "./notes";
import { sampleData } from "./sample-data";
import { documentSchema } from "./schema";
import { html } from "./template";

export const atsClassic = {
	id: "ats-classic",
	name: "ATS Classic",
	description:
		"Single-column Word-like page with Calibri-style type. Built so applicant tracking systems can read every line.",
	folder: "ats-classic",
	html,
	notes,
	documentSchema,
	sampleData: sampleData as Record<string, unknown>,
	previewPath: "/templates/builtins/ats-classic/preview.png",
	previewPdfPath: "/templates/builtins/ats-classic/preview.pdf",
	category: "ATS",
	colors: ["#000000", "#1f4e79", "#333333"],
	formats: ["PDF"],
	styleLabel: "Sans",
} satisfies BuiltinTemplateSource;
