import { z } from "zod";

export const atsResultSchema = z.object({
	score: z.number().min(0).max(100),
	verdict: z.string(),
	areas: z.array(
		z.object({
			name: z.string(),
			match: z.number().min(0).max(100),
		}),
	),
	present: z.array(z.string()),
	missing: z.array(z.string()),
});

export const keywordsResultSchema = z.object({
	mustHave: z.array(z.string()),
	niceToHave: z.array(z.string()),
	tools: z.array(z.string()),
	missing: z.array(z.string()),
});

export const leadInfoSchema = z.object({
	name: z.string().nullable(),
	email: z.string().nullable(),
});

export const matchResultSchema = z.object({
	match: z.number().min(0).max(100),
	fit: z.enum(["strong", "partial", "weak"]),
	overlapping: z.array(z.string()),
	gaps: z.array(z.string()),
	note: z.string(),
});

export type LeadInfo = z.infer<typeof leadInfoSchema>;
export type AtsResult = z.infer<typeof atsResultSchema>;
export type KeywordsResult = z.infer<typeof keywordsResultSchema>;
export type MatchResult = z.infer<typeof matchResultSchema>;

export type ToolRunResult =
	| { tool: "ats-resume-checker"; data: AtsResult }
	| { tool: "job-description-keyword-extractor"; data: KeywordsResult }
	| { tool: "resume-job-match"; data: MatchResult };
