import { z } from "zod";

export const resumeBulletSchema = z.union([
	z.string().min(1).transform((text) => ({ text })),
	z.object({
		label: z
			.string()
			.optional()
			.describe('Short bold label, e.g. "LLM Systems" or "Billing"'),
		text: z.string().min(1),
	}),
]);

export const resumeRoleSchema = z.object({
	title: z.string().min(1),
	location: z.string().min(1),
	employment: z
		.string()
		.optional()
		.describe(
			'Real employment type only: "Full-time", "Part-time", "Internship", or "Contract". Omit if unknown — never invent placeholders.',
		),
	startDate: z.string().min(1).describe('e.g. "Aug 2025"'),
	endDate: z.string().min(1).describe('e.g. "Present" or "Jul 2025"'),
	bullets: z.array(resumeBulletSchema).min(1).max(12),
});

export const resumeExperienceSchema = z.object({
	company: z.string().min(1),
	companyUrl: z
		.string()
		.optional()
		.describe("Full https URL for the company, if any"),
	roles: z
		.array(resumeRoleSchema)
		.min(1)
		.describe(
			"One or more roles at this company. Put multiple roles under the same company instead of repeating the company.",
		),
});

export const resumeSkillSchema = z.object({
	category: z.string().min(1),
	items: z
		.string()
		.min(1)
		.describe("Comma-separated list, e.g. TypeScript, Python, SQL"),
});

export const resumeProjectLinkSchema = z.object({
	label: z.string().min(1),
	url: z.string().min(1).describe("Full https URL"),
});

export const resumeProjectSchema = z.object({
	name: z.string().min(1),
	url: z
		.string()
		.optional()
		.describe("Host/path only for the project site, no https://"),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	stack: z
		.string()
		.optional()
		.describe(
			"Comma-separated tech stack, e.g. Next.js, AWS, PostgreSQL",
		),
	bullets: z.array(resumeBulletSchema).min(1).max(8),
	links: z.array(resumeProjectLinkSchema).optional(),
});

export const resumeEducationSchema = z.object({
	school: z.string().min(1),
	location: z.string().min(1),
	degree: z.string().min(1),
	startDate: z.string().min(1),
	endDate: z.string().min(1),
});

export const resumeDocumentSchema = z.object({
	name: z.string().min(1),
	email: z.string().min(1),
	phone: z.string().optional().default(""),
	location: z.string().optional().default(""),
	github: z
		.string()
		.optional()
		.default("")
		.describe("Host/path only, e.g. github.com/user — no https://"),
	linkedin: z
		.string()
		.optional()
		.default("")
		.describe("Host/path only, e.g. linkedin.com/in/user — no https://"),
	website: z
		.string()
		.optional()
		.default("")
		.describe("Host/path only, e.g. example.com — no https://"),
	summary: z.string().min(1),
	experience: z.array(resumeExperienceSchema).min(1),
	skills: z.array(resumeSkillSchema).min(1),
	projects: z.array(resumeProjectSchema).default([]),
	education: z.array(resumeEducationSchema).min(1),
});

export type ResumeBullet = z.infer<typeof resumeBulletSchema>;
export type ResumeRole = z.infer<typeof resumeRoleSchema>;
export type ResumeExperience = z.infer<typeof resumeExperienceSchema>;
export type ResumeDocument = z.infer<typeof resumeDocumentSchema>;

function normalizeBullets(bullets: unknown) {
	if (!Array.isArray(bullets)) {
		return bullets;
	}
	return bullets.map((bullet) => {
		if (typeof bullet === "string") {
			return { text: bullet };
		}
		return bullet;
	});
}

/** Accept nested company→roles, or legacy flat role rows. */
function normalizeExperience(input: unknown) {
	if (!Array.isArray(input) || input.length === 0) {
		return input;
	}

	const first = input[0];
	if (
		first &&
		typeof first === "object" &&
		"roles" in first &&
		Array.isArray((first as { roles: unknown }).roles)
	) {
		return input.map((company) => {
			if (!company || typeof company !== "object") {
				return company;
			}
			const row = company as {
				company?: unknown;
				companyUrl?: unknown;
				roles?: unknown;
			};
			return {
				...row,
				roles: Array.isArray(row.roles)
					? row.roles.map((role) => {
							if (!role || typeof role !== "object") {
								return role;
							}
							const r = role as { bullets?: unknown };
							return { ...r, bullets: normalizeBullets(r.bullets) };
						})
					: row.roles,
			};
		});
	}

	if (
		!(
			first &&
			typeof first === "object" &&
			"title" in first &&
			"company" in first
		)
	) {
		return input;
	}

	const groups: Array<{
		company: string;
		companyUrl?: string;
		roles: Array<Record<string, unknown>>;
	}> = [];

	for (const item of input) {
		if (!item || typeof item !== "object") {
			continue;
		}
		const job = item as {
			company: string;
			companyUrl?: string;
			title: string;
			location: string;
			employment?: string;
			startDate: string;
			endDate: string;
			bullets: unknown;
		};
		const role = {
			title: job.title,
			location: job.location,
			employment: job.employment,
			startDate: job.startDate,
			endDate: job.endDate,
			bullets: normalizeBullets(job.bullets),
		};
		const last = groups[groups.length - 1];
		const sameCompany =
			last &&
			last.company === job.company &&
			(last.companyUrl ?? "") === (job.companyUrl ?? "");

		if (sameCompany) {
			last.roles.push(role);
		} else {
			groups.push({
				company: job.company,
				companyUrl: job.companyUrl,
				roles: [role],
			});
		}
	}

	return groups;
}

export function parseResumeDocument(input: unknown): ResumeDocument {
	const raw =
		input && typeof input === "object"
			? {
					...(input as Record<string, unknown>),
					experience: normalizeExperience(
						(input as { experience?: unknown }).experience,
					),
					projects: Array.isArray((input as { projects?: unknown }).projects)
						? (input as { projects: unknown[] }).projects.map((project) => {
								if (!project || typeof project !== "object") {
									return project;
								}
								const row = project as { bullets?: unknown };
								return { ...row, bullets: normalizeBullets(row.bullets) };
							})
						: (input as { projects?: unknown }).projects,
				}
			: input;

	return resumeDocumentSchema.parse(raw);
}

export function stripUrlScheme(value: string) {
	return value.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}
