export type ChatActivityStepState = "running" | "done" | "failed";

export type ChatActivityStep = {
	id: string;
	name: string;
	label: string;
	state: ChatActivityStepState;
};

export type ChatActivityData = {
	steps: ChatActivityStep[];
};

export const CHAT_ACTIVITY_PLANNING_STEP_ID = "__planning";

const toolTitles: Record<string, string> = {
	"name-chat": "Naming this chat",
	nameChatTool: "Naming this chat",
	save_onboarding_context: "Saving your profile",
	"agent-onboardingAgent": "Learning about you",
	"agent-resumeAgent": "Working on your resume",
	"agent-profileEditAgent": "Learning about you",
	onboardingAgent: "Learning about you",
	resumeAgent: "Working on your resume",
	profileEditAgent: "Learning about you",
	"onboarding-agent": "Learning about you",
	"resume-agent": "Working on your resume",
	"profile-edit-agent": "Learning about you",
	patch_profile: "Updating your profile",
	update_profile: "Updating your profile",
	get_profile: "Reading your profile",
	list_resumes: "Looking through your resumes",
	get_resume: "Opening your resume",
	get_resume_template_notes: "Checking the resume template",
	get_resume_builder_notes: "Reviewing resume-writing guidance",
	get_humanizer_notes: "Polishing the wording",
	create_resume: "Creating your resume",
	append_to_resume: "Adding to your resume",
	patch_resume: "Editing your resume",
	rename_resume: "Renaming your resume",
	compile_resume: "Compiling your PDF",
	get_resume_download: "Getting your download link",
};

export function isInternalToolName(name: string) {
	return (
		name.startsWith("agent-") ||
		name.endsWith("Agent") ||
		name === "onboardingAgent" ||
		name === "resumeAgent" ||
		name === "profileEditAgent" ||
		name === "appAgent"
	);
}

export function toolStepLabel(name: string) {
	if (toolTitles[name]) {
		return toolTitles[name];
	}

	const agentMatch = name.match(/^(?:agent-)?(.+?)(?:Agent)?$/);
	const agentKey = agentMatch?.[1];
	if (agentKey && toolTitles[`${agentKey}Agent`]) {
		return toolTitles[`${agentKey}Agent`];
	}
	if (agentKey && toolTitles[agentKey]) {
		return toolTitles[agentKey];
	}
	if (agentKey && toolTitles[`agent-${agentKey}`]) {
		return toolTitles[`agent-${agentKey}`];
	}

	return name
		.replace(/^agent-/, "")
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace(/[-_]/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function isChatActivityPart(
	part: unknown,
): part is { type: "data-chat-activity"; id?: string; data: ChatActivityData } {
	return (
		typeof part === "object" &&
		part !== null &&
		"type" in part &&
		(part as { type: unknown }).type === "data-chat-activity" &&
		"data" in part
	);
}
