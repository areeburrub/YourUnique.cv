import type { ZodType } from "zod";

export type BuiltinTemplateSource = {
	id: string;
	name: string;
	description: string;
	html: string;
	notes: string;
	documentSchema: ZodType;
	sampleData: Record<string, unknown>;
	previewPath: string;
	previewPdfPath: string;
	folder: string;
	category: string;
	colors: string[];
	formats: string[];
	styleLabel: string;
};
