import { Agent } from "@mastra/core/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY,
});

export const profileExtractAgent = new Agent({
	id: "profile-extract-agent",
	name: "Profile Extract Agent",
	instructions: `You extract a durable career Profile markdown document from the user's uploaded career documents.

Documents may include resumes, experience letters, offer letters, cover letters, and other supporting files.

Write a single Profile markdown document that captures:
- Contact / identity (name, email, phone, links, location) when present
- Professional summary
- Work experience with roles, companies, dates, and concrete achievements
- Education
- Skills
- Projects, certifications, or awards when present
- Useful signals from letters (titles, employment dates, compensation bands only if clearly stated, employment confirmation)

Rules:
- Prefer facts supported by the documents. Do not invent employers, dates, or metrics.
- When documents conflict, note both and prefer the most recent/explicit source.
- Use clear markdown headings and bullet lists.
- Return only the Profile markdown in the structured profile field.`,
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
