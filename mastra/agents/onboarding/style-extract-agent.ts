import { Agent } from "@mastra/core/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY,
});

export const styleExtractAgent = new Agent({
	id: "style-extract-agent",
	name: "Style Extract Agent",
	instructions: `You extract a writing Style guide markdown document from the user's career documents.

Prefer resume documents when provided. If no resume is available, infer style from the other documents.

Capture:
- Overall tone (e.g. confident, concise, formal, technical)
- Bullet style and structure patterns
- Preferred tense and person
- Density / length preferences
- Action-verb patterns and phrasing habits
- What to avoid based on their existing writing

Rules:
- Base the guide on observable writing patterns in the documents.
- Be concrete and actionable so another writer can match the voice.
- Use clear markdown headings and bullets.
- Return only the Style guide markdown in the structured style field.`,
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
});
