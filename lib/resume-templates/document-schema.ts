import { prettifyError, z } from "zod";

const prose = "May include **bold**, *italic*, and [label](https://url). No HTML.";
const hostPath = "Host/path only, e.g. github.com/user — no https://";
const dateString = 'e.g. "Jun 2021" or "Present"';

const bulletSchema = z
	.object({
		label: z
			.string()
			.optional()
			.describe("Omit. Do not use a category prefix. Put emphasis in text with **bold**."),
		text: z
			.string()
			.min(1)
			.describe(`Full sentence. Bold skills, tools, and metrics with **...**. ${prose}`),
	})
	.strict();

const roleSchema = z
	.object({
		title: z.string().min(1),
		location: z.string().min(1),
		employment: z
			.string()
			.optional()
			.describe(
				'Real employment type only: "Full-time", "Part-time", "Internship", or "Contract". Omit if unknown — never invent placeholders.',
			),
		startDate: z.string().min(1).describe(dateString),
		endDate: z.string().min(1).describe(dateString),
		bullets: z.array(bulletSchema).min(1).max(12),
	})
	.strict();

const companySchema = z
	.object({
		company: z.string().min(1),
		companyUrl: z
			.string()
			.optional()
			.describe("Full https URL for the company, if any"),
		roles: z
			.array(roleSchema)
			.min(1)
			.describe(
				"One or more roles at this company. Put multiple roles under the same company instead of repeating the company.",
			),
	})
	.strict();

const skillGroupSchema = z
	.object({
		category: z.string().min(1),
		items: z
			.string()
			.min(1)
			.describe(
				`Comma-separated list, e.g. TypeScript, Python, SQL. ${prose}`,
			),
	})
	.strict();

const projectLinkSchema = z
	.object({
		label: z.string().min(1),
		url: z.string().min(1).describe("Full https URL"),
	})
	.strict();

const projectSchema = z
	.object({
		name: z.string().min(1),
		url: z.string().optional().describe(hostPath),
		startDate: z.string().optional().describe(dateString),
		endDate: z.string().optional().describe(dateString),
		stack: z
			.string()
			.optional()
			.describe("Comma-separated tech stack, e.g. Next.js, AWS, PostgreSQL"),
		bullets: z.array(bulletSchema).min(1).max(8),
		links: z.array(projectLinkSchema).optional(),
	})
	.strict();

const educationSchema = z
	.object({
		school: z.string().min(1),
		location: z.string().min(1),
		degree: z.string().min(1),
		startDate: z.string().min(1).describe(dateString),
		endDate: z.string().min(1).describe(dateString),
		gpa: z
			.string()
			.optional()
			.describe(
				'GPA or CGPA score only, e.g. "CGPA 8.72" or "GPA 3.8". No /10 or /4.0. Omit if unknown.',
			),
	})
	.strict();

const certificationSchema = z
	.object({
		name: z.string().min(1),
		issuer: z.string().optional(),
		startDate: z.string().optional().describe(dateString),
		endDate: z.string().optional().describe(dateString),
		bullets: z.array(bulletSchema).optional(),
	})
	.strict();

const languageSchema = z
	.object({
		name: z.string().min(1),
		level: z.string().optional(),
	})
	.strict();

const awardSchema = z
	.object({
		name: z.string().min(1),
		issuer: z.string().optional(),
		startDate: z.string().optional().describe(dateString),
		endDate: z.string().optional().describe(dateString),
		text: z.string().optional().describe(prose),
	})
	.strict();

export const resumeDocumentSchema = z
	.object({
		name: z.string().min(1),
		email: z.string().min(1),
		phone: z.string(),
		location: z.string(),
		github: z.string().describe(hostPath),
		linkedin: z.string().describe(hostPath),
		website: z.string().describe(hostPath),
		summary: z.string().min(1).describe(prose),
		experience: z.array(companySchema).min(1),
		skills: z.array(skillGroupSchema).min(1),
		projects: z.array(projectSchema),
		education: z.array(educationSchema).min(1),
		certifications: z.array(certificationSchema).optional(),
		languages: z.array(languageSchema).optional(),
		awards: z.array(awardSchema).optional(),
	})
	.strict();

export type ResumeDocument = z.infer<typeof resumeDocumentSchema>;

export const resumeDocumentJsonSchema = z.toJSONSchema(resumeDocumentSchema, {
	target: "draft-2020-12",
	reused: "inline",
}) as Record<string, unknown>;

function documentParseError(error: z.ZodError) {
	return `Document does not match the resume schema:\n${prettifyError(error)}`;
}

export function parseResumeDocument(data: unknown): Record<string, unknown> {
	const result = resumeDocumentSchema.safeParse(data);
	if (!result.success) {
		throw new Error(documentParseError(result.error));
	}
	return result.data as Record<string, unknown>;
}

export function coerceResumeDocument(data: unknown): Record<string, unknown> {
	const result = resumeDocumentSchema.safeParse(data);
	if (result.success) {
		return result.data as Record<string, unknown>;
	}
	if (data && typeof data === "object" && !Array.isArray(data)) {
		return data as Record<string, unknown>;
	}
	throw new Error(documentParseError(result.error));
}
