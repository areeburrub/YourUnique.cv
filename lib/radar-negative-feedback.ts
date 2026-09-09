import "server-only";

import {
	extractJsonMiddleware,
	generateText,
	Output,
	wrapLanguageModel,
} from "ai";
import { z } from "zod";

import { OPENROUTER_TOOLS_MODEL, openrouter } from "@/lib/ai/openrouter";
import type { DismissedRadarJob } from "@/lib/db/radar";

const feedbackSchema = z.object({
	avoid: z.array(z.string()).max(3),
});

function clip(text: string, max: number) {
	const trimmed = text.trim();
	return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

function heuristicAvoidNotes(job: DismissedRadarJob): string[] {
	const haystack = `${job.title} ${job.summary} ${job.description}`.toLowerCase();
	const notes: string[] = [];

	if (
		/\b(principal|staff|distinguished|director|vp|head of|vice president)\b/.test(
			haystack,
		)
	) {
		notes.push("Skip staff, principal, director, and VP-level titles");
	}
	if (/\b(intern|junior|graduate|entry[- ]level)\b/.test(haystack)) {
		notes.push("Skip intern, junior, and entry-level titles");
	}
	if (
		/\b(annotat|labeling|ai trainer|ai tutor|crowdwork|data labeling)\b/.test(
			haystack,
		)
	) {
		notes.push("Skip data-annotation, labeling, and AI-trainer gigs");
	}
	if (/\b(contract|freelance|contractor)\b/.test(haystack)) {
		notes.push("Skip contract and freelance-only postings");
	}

	if (notes.length === 0) {
		const shape = [job.workplace, job.location].filter(Boolean).join(", ");
		notes.push(
			shape
				? `Avoid roles with a similar mandate to "${job.title}" (${shape})`
				: `Avoid roles with a similar mandate to "${job.title}"`,
		);
	}

	return notes.slice(0, 3);
}

function cheapModel() {
	return wrapLanguageModel({
		model: openrouter(OPENROUTER_TOOLS_MODEL, {
			plugins: [{ id: "response-healing" }],
			structuredOutputs: { strict: false },
		}),
		middleware: extractJsonMiddleware(),
	});
}

/**
 * Turns a thumbs-down into reusable matcher rules — not "Title at Company".
 *
 * This only ever produces additions to the avoid-list. It never touches the
 * candidate's own free-text preferences — letting an LLM "rewrite but keep
 * the wording" of user-authored text is exactly how that field ends up
 * silently mutated over repeated dismissals.
 */
export async function extractNegativeFeedback(input: {
	job: DismissedRadarJob;
	existingAvoid: string[];
}): Promise<{ avoidNotes: string[] }> {
	const fallback = {
		avoidNotes: heuristicAvoidNotes(input.job),
	};

	try {
		const gapTerms = input.job.gaps
			.map((g) => g.term)
			.filter(Boolean)
			.slice(0, 6);
		const result = await generateText({
			model: cheapModel(),
			output: Output.object({
				schema: feedbackSchema,
				name: "negative_feedback",
			}),
			maxOutputTokens: 400,
			temperature: 0,
			instructions: `You turn a dismissed job into reusable Job Radar filters.

Rules:
- "avoid" is 1–3 short exclusion rules a matcher can follow on the NEXT search.
- Generalize. Do not write "Title at Company (marked irrelevant)".
- Name the company only if the dislike is the employer itself.
- Prefer seniority, domain (annotation/trainer gigs, agencies, etc.), employment type, or workplace mismatch.
- Check the existing avoid list first. If a rule there already covers this dismissal, return an empty list — do not add a near-duplicate with different wording.
- Never invent constraints the dismissed job does not support.`,
			prompt: [
				input.existingAvoid.length > 0
					? `Existing avoid list (do not duplicate these):\n- ${input.existingAvoid.join("\n- ")}`
					: "Existing avoid list: (none)",
				"Dismissed job:",
				`- Title: ${input.job.title}`,
				`- Company: ${input.job.company}`,
				`- Location: ${input.job.location}`,
				`- Workplace: ${input.job.workplace}`,
				`- ATS verdict: ${input.job.verdict}`,
				`- ATS summary: ${clip(input.job.summary, 400)}`,
				gapTerms.length ? `- Skill gaps: ${gapTerms.join(", ")}` : "",
				input.job.strengths.length
					? `- Strengths: ${input.job.strengths.slice(0, 6).join(", ")}`
					: "",
				`- Description:\n${clip(input.job.description, 1200)}`,
			]
				.filter(Boolean)
				.join("\n"),
			providerOptions: {
				openrouter: {
					reasoning: { effort: "none" },
				},
			},
		});

		// An empty array here is a valid answer (the model decided this
		// dismissal is already covered by an existing avoid rule) — only
		// fall back to the heuristic if the call itself failed below.
		const avoidNotes = result.output.avoid
			.map((note) => clip(note, 160))
			.filter(Boolean)
			.slice(0, 3);

		return { avoidNotes };
	} catch {
		return fallback;
	}
}
