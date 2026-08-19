import { builtinTemplateSources } from "@/templates/resume";
import { parseResumeDocument } from "@/lib/resume-templates/document-schema";
import { renderHandlebarsHtml } from "@/lib/resume-templates/handlebars";
import type { BuiltinTemplateDefinition } from "@/lib/resume-templates/types";

const builtins: BuiltinTemplateDefinition[] = builtinTemplateSources.map(
	(source) => ({
		id: source.id,
		name: source.name,
		description: source.description,
		notes: source.notes,
		inputSchema: source.schema,
		previewPath: source.previewPath,
		previewPdfPath: source.previewPdfPath,
		category: source.category,
		colors: source.colors,
		formats: source.formats,
		styleLabel: source.styleLabel,
		validate(data) {
			return parseResumeDocument(data);
		},
		render(data) {
			const document = parseResumeDocument(data);
			return renderHandlebarsHtml(source.html, document);
		},
	}),
);

const byId = new Map(builtins.map((template) => [template.id, template]));

export function listBuiltinTemplates() {
	return builtins;
}

export function getBuiltinTemplate(id: string) {
	return byId.get(id) ?? null;
}
