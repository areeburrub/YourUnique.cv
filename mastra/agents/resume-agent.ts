import { Agent } from "@mastra/core/agent";

import {
	openrouter,
	openrouterFileParserPlugins,
} from "@/lib/ai/openrouter";
import { chatMemory } from "@/mastra/memory/chat-memory";
import { usageTracker } from "@/mastra/processors/usage-tracker";

export const resumeAgent = new Agent({
	id: "resume-agent",
	name: "Resume Agent",
	description: `Helps users who already have career context with resume work: tailor resumes to job descriptions, strengthen bullets, draft cover letters, and review attached resumes. Do not use this for first-time onboarding, rebuilding saved career context, or updating saved career facts (experience, skills, education, etc.).`,
	instructions: `You are the YourUnique.cv assistant.

Help users tailor resumes to job descriptions, strengthen bullets, and draft cover letters.
Be concise and practical. When the user pastes a job description, map their experience to the role and suggest stronger, specific bullets.
When the user attaches a resume PDF or image, read it carefully (layout, sections, and wording) before giving advice.
Ask for missing context (role target, years of experience, or career details) only when needed.
Never mention agents, tools, routing, or internal systems.`,
	model: openrouter("openai/gpt-5.6-luna", {
		plugins: openrouterFileParserPlugins,
	}),
	memory: chatMemory,
	outputProcessors: [usageTracker],
});
