import { Agent } from "@mastra/core/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY,
});

export const classifyDocsAgent = new Agent({
	id: "classify-docs-agent",
	name: "Classify Docs Agent",
	instructions: `You classify career documents for onboarding.

For each attached file, choose exactly one kind:
- resume — CV / resume / curriculum vitae
- experience_letter — employment / experience / relieving letter
- offer_letter — job offer letter
- cover_letter — cover letter / application letter
- other — anything else

Rules:
- Base the kind on document content, not only the filename.
- A file can be a resume even if the filename is generic.
- Prefer resume when a document is primarily a CV-style career summary.
- Return a classification for every provided fileId.`,
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
