import { z } from "zod";

import {
	bulletSchema,
	datesSlot,
	employmentField,
	gpaField,
	hostPath,
	optionalHttps,
	prose,
	projectLinkSchema,
	skillGroupSchema,
} from "../_shared/fields";

export const documentSchema = z.object({
	name: z.string().min(1),
	headline: z
		.string()
		.optional()
		.describe(
			'Short senior title under the name, e.g. "VP of Engineering" or "Senior Product Engineer". Omit if none.',
		),
	email: z.string().min(1),
	phone: z.string(),
	location: z
		.string()
		.min(1)
		.describe("Shown in the header. City or Remote."),
	github: z.string().describe(hostPath),
	linkedin: z.string().describe(hostPath),
	website: z.string().describe(hostPath),
	summary: z.string().min(1).describe(prose),
	experience: z
		.array(
			z.object({
				company: z.string().min(1),
				companyUrl: optionalHttps,
				roles: z
					.array(
						z.object({
							title: z.string().min(1),
							location: z.string().min(1),
							employment: employmentField,
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
	skills: z.array(skillGroupSchema).min(1),
	projects: z
		.array(
			z.object({
				name: z.string().min(1),
				url: z.string().optional().describe(hostPath),
				stack: z
					.string()
					.optional()
					.describe("Optional stack; this layout treats projects as selected work"),
				bullets: z.array(bulletSchema).min(1).max(4),
				links: z.array(projectLinkSchema).optional(),
			}),
		)
		.describe(
			"Optional. Senior pages often omit this. Include only standout work. Omit or [] if none.",
		),
	education: z
		.array(
			z.object({
				school: z.string().min(1),
				location: z.string().min(1),
				degree: z.string().min(1),
				gpa: gpaField,
				dates: z.string().min(1).describe(datesSlot),
			}),
		)
		.min(1),
});

export type ExecutiveSerifDocument = z.infer<typeof documentSchema>;
