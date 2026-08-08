import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import {
	getUserContext,
	updateUserContextProfile,
} from "@/lib/db/contexts";

function requireUserId(requestContext: { get: (key: string) => unknown } | undefined) {
	const userId = requestContext?.get("userId");
	if (typeof userId !== "string" || !userId) {
		throw new Error("Unauthorized");
	}
	return userId;
}

const patchSchema = z.object({
	old_string: z
		.string()
		.min(1)
		.describe(
			"Exact text to find in the current Profile. Include enough surrounding context to make it unique.",
		),
	new_string: z
		.string()
		.describe("Replacement text. Use an empty string to delete the matched text."),
});

export function applyProfilePatches(
	profile: string,
	patches: Array<{ old_string: string; new_string: string }>,
) {
	let next = profile;

	for (const [index, patch] of patches.entries()) {
		const oldString = patch.old_string;
		const newString = patch.new_string;
		const occurrences = next.split(oldString).length - 1;

		if (occurrences === 0) {
			throw new Error(
				`Patch ${index + 1}: could not find old_string in the profile.`,
			);
		}
		if (occurrences > 1) {
			throw new Error(
				`Patch ${index + 1}: old_string matched ${occurrences} times. Include more surrounding context so it is unique.`,
			);
		}

		next = next.replace(oldString, newString);
	}

	if (!next.trim()) {
		throw new Error("Profile cannot be empty after applying patches.");
	}

	return next;
}

export const getProfileTool = createTool({
	id: "get_profile",
	description:
		"Read the user's current career Profile markdown from the database.",
	inputSchema: z.object({}),
	outputSchema: z.object({
		profile: z.string(),
		updatedAt: z.string().nullable(),
	}),
	execute: async (_input, context) => {
		const userId = requireUserId(context?.requestContext);
		const row = await getUserContext(userId);
		if (!row) {
			throw new Error("Profile not found");
		}
		return {
			profile: row.profile,
			updatedAt: row.updatedAt?.toISOString?.() ?? null,
		};
	},
});

export const patchProfileTool = createTool({
	id: "patch_profile",
	description:
		"Apply one or more exact search/replace patches to the user's Profile markdown. Prefer small unique edits over rewriting the whole document. Patches are applied in order.",
	inputSchema: z.object({
		patches: z
			.array(patchSchema)
			.min(1)
			.describe("Ordered list of exact string replacements to apply"),
	}),
	outputSchema: z.object({
		ok: z.boolean(),
		applied: z.number(),
		updatedAt: z.string().nullable(),
	}),
	execute: async (input, context) => {
		const userId = requireUserId(context?.requestContext);

		const existing = await getUserContext(userId);
		if (!existing) {
			throw new Error("Profile not found");
		}

		const nextProfile = applyProfilePatches(existing.profile, input.patches);
		const updated = await updateUserContextProfile(userId, nextProfile);
		if (!updated) {
			throw new Error("Failed to update profile");
		}

		return {
			ok: true,
			applied: input.patches.length,
			updatedAt: updated.updatedAt?.toISOString?.() ?? null,
		};
	},
});
