import { builtinTemplateSources } from "@/templates/resume";
import { renderHandlebarsHtml } from "@/lib/resume-templates/handlebars";
import {
	jsonSchemaFromZod,
	parseWithZod,
} from "@/lib/resume-templates/parse";
import type { BuiltinTemplateDefinition } from "@/lib/resume-templates/types";

const builtins: BuiltinTemplateDefinition[] = builtinTemplateSources.map(
	(source) => ({
		id: source.id,
		name: source.name,
		description: source.description,
		notes: source.notes,
		documentSchema: source.documentSchema,
		inputSchema: jsonSchemaFromZod(source.documentSchema),
		previewPath: source.previewPath,
		previewPdfPath: source.previewPdfPath,
		category: source.category,
		colors: source.colors,
		formats: source.formats,
		styleLabel: source.styleLabel,
		validate(data) {
			return parseWithZod(source.documentSchema, data);
		},
		render(data) {
			const document = parseWithZod(source.documentSchema, data);
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
