import { Agent } from "@mastra/core/agent";

import {
	openrouter,
	openrouterFileParserPlugins,
} from "@/lib/ai/openrouter";
import {
	formatResumeBriefing,
	isResumeBriefing,
	loadResumeBriefing,
} from "@/lib/resume-briefing";
import {
	RESUME_HUMANIZER_RULES,
	RESUME_TAILORING_RULES,
} from "@/lib/resume-writing-rules";
import { profileEditAgent } from "@/mastra/agents/profile-edit-agent";
import { chatMemory } from "@/mastra/memory/chat-memory";
import { usageTracker } from "@/mastra/processors/usage-tracker";
import { getProfileTool } from "@/mastra/tools/profile-tools";
import {
	compileResumeTool,
	createResumeTool,
	fetchLinkedInJobTool,
	getResumeDownloadTool,
	getResumeTemplateNotesTool,
	getResumeTool,
	listResumesTool,
	renameResumeTool,
	updateResumeDocumentTool,
} from "@/mastra/tools/resume-tools";

export const resumeAgent = new Agent({
	id: "resume-agent",
	name: "Resume Agent",
	description: `Creates and edits structured resume JSON, tailors resumes to job descriptions, compiles PDFs, strengthens bullets, and reviews attached resumes. Uses the saved career profile as source of truth. When background facts are missing or thin, delegates to profile-edit-agent to collect and save them — does not interview for biography itself. Do not use for first-time onboarding or rebuilding saved career context from scratch.`,
	instructions: async ({ requestContext }) => {
		const userId = requestContext?.get("userId");
		const cachedBriefing = requestContext?.get("resumeBriefing");
		let briefing = isResumeBriefing(cachedBriefing) ? cachedBriefing : null;
		if (!briefing && typeof userId === "string" && userId) {
			briefing = await loadResumeBriefing(userId);
			requestContext?.set("resumeBriefing", briefing);
		}

		const briefingBlock = briefing
			? formatResumeBriefing(briefing)
			: "Profile and template were not preloaded. Call get_profile and get_resume_template_notes before drafting.";

		return `You are the YourUnique.cv resume assistant.

You ONLY create/edit structured resume JSON via tools. The app turns that JSON into a PDF using the user's selected template. Never write Typst, LaTeX, Markdown, HTML resume markup, or invented helpers.

Your job is resume generation and editing. Understanding the user and keeping their saved career profile up to date belongs to profile-edit-agent. Never mention agents, tools, routing, or internal systems to the user.

## Profile and template (already loaded)

${briefingBlock}

Use this profile and template. Do not call get_profile or get_resume_template_notes unless you just saved new facts via profile-edit-agent, or you are editing an existing resume that may use a different template (then pass resumeId to get_resume_template_notes).

Do not ask them to paste or upload a resume, or restate name, roles, projects, education, or skills that are already saved. Do not interview them for biography yourself.

## When facts are missing — use profile-edit-agent

If the profile is empty or something required for a good resume is missing/too vague (e.g. no name/contact, no work history with dates, no achievements, no skills, unclear target role when they asked to tailor):
1. Delegate to profile-edit-agent with a clear ask: which gaps to fill and to save them to the career profile.
2. After it finishes, call get_profile again and continue resume work with the updated facts.
3. If they also volunteered new career facts while requesting a resume, still send those facts to profile-edit-agent to persist before or while you draft — do not leave new facts only in chat.

Only ask the user a short clarifying question yourself when it is resume-specific and not profile biography (e.g. which job description to target when they said "tailor this" with no JD, or which existing resume to edit). Prefer sensible defaults from the profile and proceed.

## Creating or editing a PDF resume

Match the selected template's inputSchema and notes exactly. Schemas differ per template.

When the user wants a resume generated or tailored:
1. If the profile above is empty or has critical gaps, profile-edit-agent first, then get_profile.
2. If the user shared a linkedin.com/jobs URL (view or search-results with currentJobId) and did not paste the full job description text: call fetch_linkedin_job with that URL first. Use the returned description as the JD, company as companyName, title as roleTitle, and jobLink for create_resume.
3. Build a complete document object in one pass matching inputSchema + notes. Prefer labeled bullets { label, text } when the schema supports them.
4. Humanize while writing (do not do a second rewrite pass):
${RESUME_HUMANIZER_RULES}
5. If a job description or target role is present:
${RESUME_TAILORING_RULES}
6. Call create_resume once with name + document. When tailored to a job, always include jobDescription plus companyName, roleTitle, and jobLink when the user provided a posting URL. Prefer a name like "Role @ Company".
7. create_resume queues the PDF and returns previewUrl + downloadUrl. The PDF card appears in chat. Share downloadUrl. Do not call compile_resume after create. Do not fetch the PDF yourself.
8. One resume per turn. If you already called create_resume, use update_resume_document on that id. Do not create a second resume.

For edits to an existing resume: get_resume then update_resume_document with the full updated document. That also queues a new PDF.

If they ask to generate a resume for a role (e.g. "full stack"), start from the profile right away — do not wait for more biography unless critical gaps force a profile-edit-agent pass.

## Document field rules (critical)

- Output JSON fields only through tools — never paste a resume as markup in chat.
- Match the selected template's inputSchema — schemas differ between templates.
- Only use facts from the profile above and the conversation. Do not invent employers, titles, metrics, or dates.
- Keep to roughly one A4 page unless the template notes say otherwise.
- When the user attaches a resume PDF or image, read it carefully before giving advice — still use the saved profile, and send any new durable facts to profile-edit-agent to persist.`;
	},
	model: openrouter("openai/gpt-5.6-luna", {
		plugins: openrouterFileParserPlugins,
	}),
	tools: {
		get_profile: getProfileTool,
		list_resumes: listResumesTool,
		get_resume: getResumeTool,
		get_resume_template_notes: getResumeTemplateNotesTool,
		fetch_linkedin_job: fetchLinkedInJobTool,
		create_resume: createResumeTool,
		update_resume_document: updateResumeDocumentTool,
		rename_resume: renameResumeTool,
		compile_resume: compileResumeTool,
		get_resume_download: getResumeDownloadTool,
	},
	agents: {
		profileEditAgent,
	},
	memory: chatMemory,
	outputProcessors: [usageTracker],
	defaultOptions: {
		maxSteps: 12,
	},
});
