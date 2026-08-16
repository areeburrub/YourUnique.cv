import { getUserContext } from "@/lib/db/contexts";
import { resolveUserSelectedTemplate } from "@/lib/resume-templates/registry";

export type ResumeBriefing = {
	profile: string;
	profileUpdatedAt: string | null;
	templateRef: string;
	templateName: string;
	templateNotes: string;
	inputSchema: Record<string, unknown>;
};

export function isResumeBriefing(value: unknown): value is ResumeBriefing {
	if (!value || typeof value !== "object") {
		return false;
	}
	const record = value as Record<string, unknown>;
	return (
		typeof record.profile === "string" &&
		typeof record.templateRef === "string" &&
		typeof record.templateName === "string" &&
		typeof record.templateNotes === "string" &&
		Boolean(record.inputSchema) &&
		typeof record.inputSchema === "object"
	);
}

export async function loadResumeBriefing(
	userId: string,
): Promise<ResumeBriefing> {
	const [context, template] = await Promise.all([
		getUserContext(userId),
		resolveUserSelectedTemplate(userId),
	]);

	return {
		profile: context?.profile?.trim() || "",
		profileUpdatedAt: context?.updatedAt?.toISOString?.() ?? null,
		templateRef: template.ref,
		templateName: template.name,
		templateNotes: template.notes,
		inputSchema: template.inputSchema,
	};
}

export function formatResumeBriefing(briefing: ResumeBriefing) {
	const profile = briefing.profile || "(empty — delegate to profile-edit-agent before drafting)";
	return `## Saved career profile
Updated: ${briefing.profileUpdatedAt ?? "unknown"}

${profile}

## Selected template
- ref: ${briefing.templateRef}
- name: ${briefing.templateName}

### Template notes
${briefing.templateNotes}

### inputSchema
${JSON.stringify(briefing.inputSchema)}`;
}
