import { z } from "zod";

export const resumeStyleItemSchema = z.object({
	id: z.string().min(1).max(64),
	title: z.string().trim().min(1).max(80),
	instruction: z.string().trim().min(1).max(500),
});

export const resumeStyleMemorySchema = z.object({
	items: z.array(resumeStyleItemSchema).max(30),
});

export type ResumeStyleItem = z.infer<typeof resumeStyleItemSchema>;
export type ResumeStyleMemory = z.infer<typeof resumeStyleMemorySchema>;

export const EMPTY_RESUME_STYLE: ResumeStyleMemory = { items: [] };

export function parseResumeStyle(value: unknown): ResumeStyleMemory {
	const parsed = resumeStyleMemorySchema.safeParse(value);
	return parsed.success ? parsed.data : EMPTY_RESUME_STYLE;
}

export function formatResumeStyleForAgent(style: ResumeStyleMemory) {
	if (style.items.length === 0) {
		return "No saved style preferences. Use the default writing rules.";
	}

	const lines = style.items.map(
		(item) => `- **${item.title}**: ${item.instruction}`,
	);
	return `Follow these over the default writing rules when they conflict.\n${lines.join("\n")}`;
}
