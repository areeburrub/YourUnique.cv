import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY,
});

export const resumeAgent = new Agent({
	id: "resume-agent",
	name: "Resume Agent",
	instructions: `You are the YourUnique.cv resume assistant.

Help users tailor resumes to job descriptions, strengthen bullets, and draft cover letters.
Be concise and practical. When the user pastes a job description, map their experience to the role and suggest stronger, specific bullets.
When the user attaches a resume PDF or image, read it carefully (layout, sections, and wording) before giving advice.
Ask for missing context (role target, years of experience, or profile details) only when needed.`,
	model: openrouter("openai/gpt-4o-mini", {
		plugins: [
			{
				id: "file-parser",
				pdf: {
					engine: "native",
				},
			},
		],
	}),
	memory: new Memory({
		options: {
			lastMessages: 20,
			generateTitle: {
				model: "openrouter/openai/gpt-4o-mini",
				instructions: `You write a short sidebar title (3–7 words) from the conversation transcript only.

Rules:
- Base the title only on what the USER wrote or attached (filename, company, concrete ask).
- If a file was attached, prefer the filename without extension.
- Do not invent job titles, companies, or tasks that are not in the transcript.
- Do not use generic phrases like "Tailoring Resume", "Resume Review", or "Career Chat" unless the user used those exact words.
- Never answer the user. Return only the title text — no quotes, no colons, no punctuation fluff.`,
				minMessages: 2,
			} as {
				model: string;
				instructions: string;
				minMessages: number;
			},
		},
	}),
});
