import { Agent } from "@mastra/core/agent";

import { openrouter } from "@/lib/ai/openrouter";
import { onboardingAgent } from "@/mastra/agents/onboarding-agent";
import { profileEditAgent } from "@/mastra/agents/profile-edit-agent";
import { resumeAgent } from "@/mastra/agents/resume-agent";
import { chatMemory } from "@/mastra/memory/chat-memory";
import { usageTracker } from "@/mastra/processors/usage-tracker";

/**
 * Supervisor for all chat (main + profile): routes between onboarding,
 * resume help, and durable career-context edits. Always the HTTP entry point.
 */
export const appAgent = new Agent({
	id: "app-agent",
	name: "App Agent",
	instructions: async ({ requestContext }) => {
		const chatSurface = requestContext?.get("chatSurface");
		const needsOnboarding = requestContext?.get("needsOnboarding") === true;
		const onProfile = chatSurface === "profile";

		if (needsOnboarding) {
			return `You are YourUnique.cv's assistant. Speak as one product assistant.

Never mention agents, tools, routing, specialists, delegation, Profile, or internal failures.
If something goes wrong internally, continue helpfully from what you know — ask the next natural question instead of apologizing about a process.

The user has not finished sharing their career context yet. Always use onboarding-agent for this turn and relay only its user-facing reply.`;
		}

		return `You are YourUnique.cv's assistant. Speak as one product assistant.

Never mention agents, tools, routing, specialists, delegation, Profile, or internal failures.
If something goes wrong internally, continue helpfully from what you know — ask the next natural question instead of apologizing about a process.

The user already has a saved career profile from onboarding. Resume work must use that profile — never re-interview them for their background.

Route by intent and relay only the specialist's user-facing reply:
- Use profile-edit-agent when the user wants to update, add, remove, or correct saved career facts (experience, skills, education, summary, contact, projects, etc.) — including when they say things like "update my resume", "add this job", or "change my skills", or when the message includes [Profile context] blocks.
- Use resume-agent for drafting/tailoring resumes, strengthening bullets for a job, generating a PDF, or reviewing an attached resume without changing saved career context. Resume-agent loads get_profile itself — do not ask the user to paste a resume or restate experience first.
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
	outputProcessors: [usageTracker],
	defaultOptions: {
		maxSteps: 8,
	},
});
