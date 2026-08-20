import { z } from "zod";

const prose =
	'Inline HTML only: <strong>, <em>, <a href="https://...">label</a>. No markdown. No other tags.';
const hostPath = "Host/path only, e.g. github.com/user — no https://";
const datesSlot =
	'Ready-to-print range as shown on the page, e.g. "Mar 2024 – Present". En dash. One string — do not send startDate/endDate.';

const bulletSchema = z.object({
	label: z
		.string()
		.optional()
		.describe("Omit. Put emphasis in text with <strong>."),
	text: z
		.string()
		.min(1)
		.describe(`Full sentence. Bold skills, tools, and metrics with <strong>...</strong>. ${prose}`),
});

export const documentSchema = z.object({
	name: z.string().min(1),
	email: z.string().min(1),
	phone: z.string(),
	location: z
		.string()
		.min(1)
		.describe("Shown in the centered header. City or Remote."),
	github: z.string().describe(hostPath),
	linkedin: z.string().describe(hostPath),
	website: z.string().describe(hostPath),
	summary: z.string().min(1).describe(prose),
	experience: z
		.array(
			z.object({
				company: z.string().min(1),
				companyUrl: z
					.string()
					.optional()
					.describe("Full https URL for the company, if any"),
				roles: z
					.array(
						z.object({
							title: z.string().min(1),
							location: z.string().min(1),
							employment: z
								.string()
								.optional()
								.describe(
									'Real employment type only: "Full-time", "Part-time", "Internship", or "Contract". Omit if unknown.',
								),
							dates: z.string().min(1).describe(datesSlot),
							bullets: z.array(bulletSchema).min(1).max(8),
						}),
					)
					.min(1)
					.describe(
						"Multiple titles at the same company go here. Do not repeat the company.",
					),
			}),
		)
		.min(1),
	skills: z
		.array(
			z.object({
				category: z.string().min(1),
				items: z
					.string()
					.min(1)
					.describe(
						"Comma-separated list, e.g. TypeScript, Python, SQL. Plain text, no tags.",
					),
			}),
		)
		.min(1),
	projects: z
		.array(
			z.object({
				name: z.string().min(1),
				url: z.string().optional().describe(hostPath),
				stack: z
					.string()
					.optional()
					.describe("Renders under the project title in muted type"),
				bullets: z.array(bulletSchema).min(1).max(4),
				links: z
					.array(
						z.object({
							label: z.string().min(1),
							url: z.string().min(1).describe("Full https URL"),
						}),
					)
					.optional(),
			}),
		)
		.describe("Optional. Title, stack, then bullets. Omit or [] if none."),
	education: z
		.array(
			z.object({
				school: z.string().min(1),
				location: z.string().min(1),
				degree: z.string().min(1),
				gpa: z
					.string()
					.optional()
					.describe(
						'Score only, e.g. "CGPA 8.72" or "GPA 3.8". No /10 or /4.0. Omit if unknown.',
					),
				dates: z.string().min(1).describe(datesSlot),
			}),
		)
		.min(1),
});

export type NavyCenteredDocument = z.infer<typeof documentSchema>;
