import { z } from "zod";

const atsGapSchema = z.object({
	term: z.string(),
	kind: z.enum(["required", "preferred"]).nullish(),
	lift: z.number().nullish(),
	from: z.number().nullish(),
	to: z.number().nullish(),
});

const atsAreaSchema = z.object({
	area: z.string(),
	score: z.number(),
});

/** Per-thread scratchpad: chat recap plus a frozen ATS artifact. Merge updates. */
export const threadSnapshotSchema = z.object({
	conversation: z
		.object({
			summary: z
				.string()
				.describe(
					"4–8 sentences covering the whole thread so far. Facts and exact numbers. Not a vibe recap.",
				)
				.nullish(),
			currentTask: z.string().nullish(),
			lastUserAsk: z.string().nullish(),
			decisions: z.array(z.string()).nullish(),
			openQuestions: z.array(z.string()).nullish(),
		})
		.nullish(),
	resume: z
		.object({
			resumeId: z.string().nullish(),
			company: z.string().nullish(),
			role: z.string().nullish(),
		})
		.nullish(),
	ats: z
		.object({
			resumeId: z.string().nullish(),
			company: z.string().nullish(),
			role: z.string().nullish(),
			score: z.number().nullish(),
			scorePotential: z.number().nullish(),
			hireFit: z.enum(["yes", "maybe", "no"]).nullish(),
			seniorityFit: z.string().nullish(),
			exactRequired: z.number().nullish(),
			totalRequired: z.number().nullish(),
			skillsInSkills: z.number().nullish(),
			requiredSkillTerms: z.number().nullish(),
			lead: z.string().nullish(),
			matches: z.array(z.string()).nullish(),
			gaps: z.array(atsGapSchema).nullish(),
			areas: z.array(atsAreaSchema).nullish(),
		})
		.nullish(),
});

export type ThreadSnapshot = z.infer<typeof threadSnapshotSchema>;

export const THREAD_SNAPSHOT_RULES = `You have thread working memory (JSON). It is the recap of THIS chat, not the career profile (that is already in the briefing / saved profile).

## Conversation summary — keep it current

On every turn, call updateWorkingMemory with only the \`conversation\` fields that changed:
- summary: 4–8 sentences that cover the WHOLE thread so far (not only this turn). Who they are applying to, what we already built or edited, decisions they made, what they asked last. Keep numbers exact (86, not "high 80s").
- currentTask, lastUserAsk, decisions[], openQuestions[] when they change.

Omit keys you are not updating. Do not send null for empty resume/ats/currentTask — leave those keys out.

Do not dump the profile, resume JSON, or JD into working memory. Do not mention working memory to the user.

Merge only what you send. Omit \`ats\` unless the ATS rules below say to overwrite it.`;

export const ATS_SNAPSHOT_RULES = `## ATS snapshot — freeze the score

Working memory \`ats\` is the source of truth for this thread's ATS Analysis.

- If \`ats\` is already filled for this resume + this JD/role, and this turn did NOT change the saved resume document (\`create_resume\` / content \`patch_resume\`) and the JD/role did not change: reprint that snapshot in the ATS Analysis markdown. Same score, same matches, same gaps, same area rows, same lead sentence. Do not pick a new term list. Do not recalculate. Do not round or "improve" N.
- After you first score, or after a content patch / new JD: run the formula once, show that report, then updateWorkingMemory with the full \`ats\` object (and \`resume\` ids). Arrays replace. Include score, scorePotential, hireFit, seniorityFit, exactRequired, totalRequired, skillsInSkills, requiredSkillTerms, lead, matches (exact required terms), gaps, areas.
- New JD or different resumeId: overwrite \`ats\` and \`resume\` entirely. Do not keep the old score.
- Never put ATS numbers only in \`conversation.summary\`. The summary may mention them; \`ats\` owns them.
- User says "what's my score?" / fit follow-up: render \`ats\`. Do not score again.
- Never send \`ats: null\` or \`resume: null\`. That deletes the snapshot. Omit those keys instead.`;
