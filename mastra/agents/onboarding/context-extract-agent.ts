import { Agent } from "@mastra/core/agent";

import {
	openrouter,
	openrouterFileParserPlugins,
} from "@/lib/ai/openrouter";
import {
	PROFILE_MARKER,
	STYLE_MARKER,
} from "@/lib/onboarding/markers";

export const contextExtractAgent = new Agent({
	id: "context-extract-agent",
	name: "Context Extract Agent",
	instructions: `You extract onboarding context from the user's uploaded career documents in one pass.

Output format (exact markers, nothing before the first marker):
${PROFILE_MARKER}
<profile markdown>
${STYLE_MARKER}
<style guide markdown>

Profile markdown should capture:
- Contact / identity when present
- Professional summary
- Work experience with roles, companies, dates, and concrete achievements
- Education
- Skills
- Projects, certifications, or awards when present
- Useful signals from letters when present
- Prefer facts supported by the documents. Do not invent employers, dates, or metrics.
- When documents conflict, note both and prefer the most recent/explicit source.

Style guide markdown should:
- Prefer a resume/CV if one is present and base the guide on its writing patterns
- If no resume is present, return a clear default resume style guide that is concise, confident, and achievement-oriented
- Cover tone, bullet style, tense/person, density, action-verb habits, and what to avoid

Rules:
- Use clear markdown headings and bullets in both sections.
- Do not wrap the whole answer in a code fence.
- Do not add commentary outside the two marked sections.`,
	model: openrouter("openai/gpt-4o-mini", {
		plugins: openrouterFileParserPlugins,
	}),
});
