import { z } from "zod";

export const prose =
	'Inline HTML only: <strong>, <em>, <a href="https://...">label</a>. No markdown. No other tags.';
export const hostPath = "Host/path only, e.g. github.com/user — no https://";
export const datesSlot =
	'Ready-to-print range as shown on the page, e.g. "Mar 2024 – Present". En dash. One string — do not send startDate/endDate.';

export const bulletSchema = z.object({
	label: z
		.string()
		.optional()
		.describe("Omit. Put emphasis in text with <strong>."),
	text: z
		.string()
		.min(1)
		.describe(
			`Full sentence. Bold skills, tools, and metrics with <strong>...</strong>. ${prose}`,
		),
});

export const optionalHttps = z
	.string()
	.optional()
	.describe("Full https URL for the company, if any");

export const employmentField = z
	.string()
	.optional()
	.describe(
		'Real employment type only: "Full-time", "Part-time", "Internship", or "Contract". Omit if unknown.',
	);

export const skillGroupSchema = z.object({
	category: z.string().min(1),
	items: z
		.string()
		.min(1)
		.describe(
			"Comma-separated list, e.g. TypeScript, Python, SQL. Plain text, no tags.",
		),
});

export const projectLinkSchema = z.object({
	label: z.string().min(1),
	url: z.string().min(1).describe("Full https URL"),
});

export const gpaField = z
	.string()
	.optional()
	.describe(
		'Score only, e.g. "CGPA 8.72" or "GPA 3.8". No /10 or /4.0. Omit if unknown.',
	);
