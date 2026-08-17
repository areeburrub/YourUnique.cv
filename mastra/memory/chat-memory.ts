import { Memory } from "@mastra/memory";

import { OPENROUTER_MEMORY_MODEL } from "@/lib/ai/openrouter";

export const chatMemory = new Memory({
	options: {
		lastMessages: 20,
		generateTitle: {
			model: OPENROUTER_MEMORY_MODEL,
			instructions: `You write a short sidebar title (3–7 words) from the conversation transcript only.

Rules:
- Base the title only on what the USER wrote or attached (filename, company, concrete ask).
- If a file was attached, prefer the filename without extension.
- If the user is onboarding, prefer something concrete like "Getting to know you" only when nothing more specific is available.
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
});
