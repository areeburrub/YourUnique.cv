export type BuiltinTemplateSource = {
	id: string;
	name: string;
	description: string;
	html: string;
	notes: string;
	schema: Record<string, unknown>;
	sampleData: Record<string, unknown>;
	previewPath: string;
	previewPdfPath: string;
	folder: string;
	category: string;
	colors: string[];
	formats: string[];
	styleLabel: string;
};
