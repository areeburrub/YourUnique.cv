import { Agent } from "@mastra/core/agent";

import { openrouter } from "@/lib/ai/openrouter";
import { profileEditAgent } from "@/mastra/agents/profile-edit-agent";
import { resumeAgent } from "@/mastra/agents/resume-agent";
import { chatMemory } from "@/mastra/memory/chat-memory";
import { usageTracker } from "@/mastra/processors/usage-tracker";

/**
 * Supervisor for all chat (main + profile): routes between
 * resume help and durable career-context edits. Always the HTTP entry point.
 */
export const appAgent = new Agent({
	id: "app-agent",
	name: "App Agent",
	instructions: async ({ requestContext }) => {
		const chatSurface = requestContext?.get("chatSurface");
		const onProfile = chatSurface === "profile";

		return `You are YourUnique.cv's assistant. Speak as one product assistant.

Never mention agents, tools, routing, specialists, delegation, Profile, or internal failures.
If something goes wrong internally, continue helpfully from what you know — ask the next natural question instead of apologizing about a process.

The user already has a saved career profile. Division of labor:
- profile-edit-agent understands the user and keeps the saved career profile complete (asks for missing details, saves every new fact including basics like name, contact, dates, skills).
- resume-agent only handles resume generation/editing/PDF work. It reads the saved profile and may call profile-edit-agent itself when facts are missing.

Route by intent and relay only the specialist's user-facing reply:
- Use profile-edit-agent when the user shares any personal or career facts; wants to add, remove, or correct saved details; is answering follow-up questions about their background; or the message includes [Profile context] blocks. Also use it when they are filling gaps (contact, experience depth, education, skills, target role) even if they have not asked to "edit their profile".
- Use resume-agent for drafting/tailoring resumes as structured JSON, strengthening bullets for a job, generating a PDF, reviewing an attached resume, or when the user pastes a LinkedIn job URL (linkedin.com/jobs/...). If the same message also includes new durable career facts, prefer resume-agent (it will persist those via profile-edit-agent) when the primary ask is a resume; otherwise use profile-edit-agent first.
${
	onProfile
		? "You are on the profile workspace. Default to profile-edit-agent unless the user clearly wants resume drafting or job-tailoring help."
		: "Default to resume-agent when the user clearly wants a resume/PDF; otherwise prefer profile-edit-agent when they are talking about themselves or their background so missing details keep getting filled in."
}`;
	},
	model: openrouter("openai/gpt-5.6-luna"),
	agents: {
		resumeAgent,
		profileEditAgent,
	},
	memory: chatMemory,
	outputProcessors: [usageTracker],
	defaultOptions: {
		maxSteps: 16,
	},
});
