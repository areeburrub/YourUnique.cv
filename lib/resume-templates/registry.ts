import { getUserContext } from "@/lib/db/contexts";
import { getUserFileForUser } from "@/lib/db/files";
import {
	getResumeTemplateForUser,
	listResumeTemplatesForUser,
} from "@/lib/db/templates";
import { fileAppUrl } from "@/lib/uploads";
import { getBuiltinTemplate, listBuiltinTemplates } from "@/lib/resume-templates/builtins";
import { coerceResumeDocument, resumeDocumentJsonSchema } from "@/lib/resume-templates/document-schema";
import { renderHandlebarsHtml } from "@/lib/resume-templates/handlebars";
import {
	builtinRef,
	customRef,
	normalizeTemplateRef,
	parseTemplateRef,
} from "@/lib/resume-templates/refs";
import {
	DEFAULT_TEMPLATE_REF,
	type ResolvedTemplate,
	type TemplateListItem,
	type TemplateRef,
} from "@/lib/resume-templates/types";

export function customTemplatePreviewPdfKey(userId: string, templateId: string) {
	return `users/${userId}/templates/${templateId}/preview.pdf`;
}

function builtinListItem(
	template: ReturnType<typeof listBuiltinTemplates>[number],
): TemplateListItem {
	return {
		ref: builtinRef(template.id),
		kind: "builtin",
		id: template.id,
		name: template.name,
		description: template.description,
		previewUrl: template.previewPath,
		previewPdfUrl: template.previewPdfPath,
		status: "ready",
		error: null,
		category: template.category,
		colors: template.colors,
		formats: template.formats,
		styleLabel: template.styleLabel,
	};
}

export async function listTemplatesForUser(userId: string): Promise<{
	selectedRef: TemplateRef;
	templates: TemplateListItem[];
}> {
	const [context, customRows] = await Promise.all([
		getUserContext(userId),
		listResumeTemplatesForUser(userId),
	]);

	const selectedRef = normalizeTemplateRef(context?.templateRef);

	const builtins = listBuiltinTemplates().map(builtinListItem);
	const customs: TemplateListItem[] = await Promise.all(
		customRows.map(async (row) => {
			let previewUrl: string | null = null;
			if (row.previewFileId) {
				const file = await getUserFileForUser(row.previewFileId, userId);
				previewUrl = file ? fileAppUrl(file.id) : null;
			}

			let previewPdfUrl: string | null = null;
			if (row.previewPdfFileId) {
				const file = await getUserFileForUser(row.previewPdfFileId, userId);
				previewPdfUrl = file ? fileAppUrl(file.id) : null;
			}

			return {
				ref: customRef(row.id),
				kind: "custom" as const,
				id: row.id,
				name: row.name,
				description: row.description,
				previewUrl,
				previewPdfUrl,
				status: row.status,
				error: row.error,
				category: "Custom",
				colors: ["#111111", "#C23B2E"],
				formats: ["PDF"],
				styleLabel: "Custom",
				sourceFileId: row.sourceFileId,
				createdAt: row.createdAt.toISOString(),
			};
		}),
	);

	return {
		selectedRef,
		templates: [...builtins, ...customs],
	};
}

export async function resolveTemplate(
	ref: string,
	userId: string,
): Promise<ResolvedTemplate> {
	const normalized = normalizeTemplateRef(ref);
	const { kind, id } = parseTemplateRef(normalized);

	if (kind === "builtin") {
		const template = getBuiltinTemplate(id);
		if (!template) {
			throw new Error(`Unknown builtin template: ${id}`);
		}
		return {
			ref: builtinRef(template.id),
			kind: "builtin",
			id: template.id,
			name: template.name,
			description: template.description,
			inputSchema: template.inputSchema,
			notes: template.notes,
			previewUrl: template.previewPath,
			previewPdfUrl: template.previewPdfPath,
			status: "ready",
			error: null,
			render: template.render,
			validate: template.validate,
		};
	}

	const row = await getResumeTemplateForUser(id, userId);
	if (!row) {
		throw new Error("Custom template not found");
	}
	if (row.status !== "ready") {
		throw new Error(
			`Custom template is not ready (status: ${row.status}${row.error ? `: ${row.error}` : ""})`,
		);
	}

	let previewUrl: string | null = null;
	if (row.previewFileId) {
		const file = await getUserFileForUser(row.previewFileId, userId);
		previewUrl = file ? fileAppUrl(file.id) : null;
	}

	let previewPdfUrl: string | null = null;
	if (row.previewPdfFileId) {
		const file = await getUserFileForUser(row.previewPdfFileId, userId);
		previewPdfUrl = file ? fileAppUrl(file.id) : null;
	}

	return {
		ref: customRef(row.id),
		kind: "custom",
		id: row.id,
		name: row.name,
		description: row.description,
		inputSchema: resumeDocumentJsonSchema,
		notes: row.notes,
		previewUrl,
		previewPdfUrl,
		status: row.status,
		error: row.error,
		render(data) {
			return renderHandlebarsHtml(row.html, coerceResumeDocument(data));
		},
		validate(data) {
			return coerceResumeDocument(data);
		},
	};
}

export async function resolveUserSelectedTemplate(userId: string) {
	const context = await getUserContext(userId);
	const ref = normalizeTemplateRef(context?.templateRef);
	return resolveTemplate(ref, userId);
}

export { DEFAULT_TEMPLATE_REF };
