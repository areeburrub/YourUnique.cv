import { getUserContext } from "@/lib/db/contexts";
import {
	formatResumeStyleForAgent,
	parseResumeStyle,
	type ResumeStyleMemory,
} from "@/lib/resume-style";
import { resolveUserSelectedTemplate } from "@/lib/resume-templates/registry";

export type ResumeBriefing = {
	profile: string;
	profileUpdatedAt: string | null;
	templateRef: string;
	templateName: string;
	templateNotes: string;
	templateSchema: Record<string, unknown>;
	resumeStyle: ResumeStyleMemory;
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
		Boolean(record.templateSchema) &&
		typeof record.templateSchema === "object" &&
		Boolean(record.resumeStyle) &&
		typeof record.resumeStyle === "object"
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
		templateSchema: template.inputSchema,
		resumeStyle: parseResumeStyle(context?.resumeStyle),
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

### Document JSON schema
create_resume.document must match this schema. patch_resume applies JSON Pointer ops; the document after those ops must still match. It is specific to this template.

\`\`\`json
${JSON.stringify(briefing.templateSchema, null, 2)}
\`\`\`

## Resume style memory
${formatResumeStyleForAgent(briefing.resumeStyle)}`;
}
