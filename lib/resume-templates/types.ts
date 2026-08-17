export const DEFAULT_TEMPLATE_REF = "builtin:classic-serif";

export type TemplateKind = "builtin" | "custom";

export type TemplateRef =
	| `builtin:${string}`
	| `custom:${string}`;

export type ResolvedTemplate = {
	ref: TemplateRef;
	kind: TemplateKind;
	id: string;
	name: string;
	description: string;
	inputSchema: Record<string, unknown>;
	notes: string;
	previewUrl: string | null;
	previewPdfUrl: string | null;
	status: "ready" | "drafting" | "failed";
	error: string | null;
	render: (data: Record<string, unknown>) => string;
	validate: (data: unknown) => Record<string, unknown>;
};

export type TemplateListItem = {
	ref: TemplateRef;
	kind: TemplateKind;
	id: string;
	name: string;
	description: string;
	previewUrl: string | null;
	previewPdfUrl: string | null;
	status: "ready" | "drafting" | "failed";
	error: string | null;
	category: string;
	colors: string[];
	formats: string[];
	styleLabel: string;
	sourceFileId?: string | null;
	createdAt?: string | null;
};

export type BuiltinTemplateDefinition = {
	id: string;
	name: string;
	description: string;
	notes: string;
	inputSchema: Record<string, unknown>;
	previewPath: string | null;
	previewPdfPath: string | null;
	category: string;
	colors: string[];
	formats: string[];
	styleLabel: string;
	validate: (data: unknown) => Record<string, unknown>;
	render: (data: Record<string, unknown>) => string;
};
