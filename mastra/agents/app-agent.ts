import { Agent } from "@mastra/core/agent";

import { openrouter } from "@/lib/ai/openrouter";
import { onboardingAgent } from "@/mastra/agents/onboarding-agent";
import { profileEditAgent } from "@/mastra/agents/profile-edit-agent";
import { resumeAgent } from "@/mastra/agents/resume-agent";
import { chatMemory } from "@/mastra/memory/chat-memory";

/**
 * Supervisor for post-onboarding chat (main + profile): routes between
 * resume help and durable career-context edits. First-time onboarding
 * still goes straight to onboarding-agent from the API routes.
 */
export const appAgent = new Agent({
	id: "app-agent",
	name: "App Agent",
	instructions: async ({ requestContext }) => {
		const chatSurface = requestContext?.get("chatSurface");
		const onProfile = chatSurface === "profile";

		return `You are YourUnique.cv's assistant. Speak as one product assistant.

Never mention agents, tools, routing, specialists, delegation, Profile, Style, or internal failures.
If something goes wrong internally, continue helpfully from what you know — ask the next natural question instead of apologizing about a process.

Route by intent and relay only the specialist's user-facing reply:
- Use profile-edit-agent when the user wants to update, add, remove, or correct saved career facts (experience, skills, education, summary, contact, projects, etc.) — including when they say things like "update my resume", "add this job", or "change my skills", or when the message includes [Profile context] blocks.
- Use resume-agent for drafting/tailoring resumes and cover letters, strengthening bullets for a job, or reviewing an attached resume without changing saved career context.
- Use onboarding-agent only if the user clearly asks to rebuild their saved career context from scratch.
${
	onProfile
		? "You are on the profile workspace. Default to profile-edit-agent unless the user clearly wants resume drafting or job-tailoring help."
		: "Default to resume-agent when the intent is unclear."
}`;
	},
	model: openrouter("openai/gpt-5.6-luna"),
	agents: {
		onboardingAgent,
		resumeAgent,
		profileEditAgent,
	},
	memory: chatMemory,
	defaultOptions: {
		maxSteps: 8,
	},
});
