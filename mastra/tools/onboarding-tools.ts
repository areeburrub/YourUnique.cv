import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { upsertUserContext } from "@/lib/db/contexts";

function requireUserId(
	requestContext: { get: (key: string) => unknown } | undefined,
) {
	const userId = requestContext?.get("userId");
	if (typeof userId !== "string" || !userId) {
		throw new Error("Unauthorized");
	}
	return userId;
}

function readSourceFileIds(
	requestContext: { get: (key: string) => unknown } | undefined,
) {
	const value = requestContext?.get("sourceFileIds");
	if (!Array.isArray(value)) {
		return [] as string[];
	}
	return value.filter((id): id is string => typeof id === "string");
}

export const saveOnboardingContextTool = createTool({
	id: "save_onboarding_context",
	description:
		"Save the user's career Profile and Style guide once you have gathered enough information from their documents and answers. Call this to finish onboarding (or to rebuild their saved context).",
	inputSchema: z.object({
		profile: z
			.string()
			.min(1)
			.describe(
				"Full profile markdown: contact/identity when known, professional summary, work experience (roles, companies, dates, achievements), education, skills, and projects/certifications when present.",
			),
		style: z
			.string()
			.min(1)
			.describe(
				"Style guide markdown: tone, bullet style, tense/person, density, action-verb habits, and what to avoid.",
			),
	}),
	outputSchema: z.object({
		ok: z.boolean(),
	}),
	execute: async (input, context) => {
		const userId = requireUserId(context?.requestContext);
		const sourceFileIds = readSourceFileIds(context?.requestContext);

		await upsertUserContext({
			userId,
			profile: input.profile,
			style: input.style,
			sourceFileIds,
		});

		return { ok: true };
	},
});
