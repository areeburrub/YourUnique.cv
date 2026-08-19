import { createTool } from "@mastra/core/tools";
import { nanoid } from "nanoid";
import { z } from "zod";

import {
	getUserContext,
	updateUserContextResumeStyle,
} from "@/lib/db/contexts";
import { isResumeBriefing } from "@/lib/resume-briefing";
import {
	parseResumeStyle,
	resumeStyleItemSchema,
	type ResumeStyleItem,
	type ResumeStyleMemory,
} from "@/lib/resume-style";

function requireUserId(requestContext: { get: (key: string) => unknown } | undefined) {
	const userId = requestContext?.get("userId");
	if (typeof userId !== "string" || !userId) {
		throw new Error("Unauthorized");
	}
	return userId;
}

function upsertStyleItem(
	style: ResumeStyleMemory,
	title: string,
	instruction: string,
	id?: string,
): ResumeStyleMemory {
	const existingIndex = id
		? style.items.findIndex((item) => item.id === id)
		: style.items.findIndex(
				(item) => item.title.toLowerCase() === title.toLowerCase(),
			);

	const nextItem: ResumeStyleItem = {
		id: id && existingIndex >= 0 ? id : nanoid(12),
		title,
		instruction,
	};

	if (existingIndex >= 0) {
		const items = style.items.slice();
		items[existingIndex] = {
			...items[existingIndex],
			...nextItem,
			id: style.items[existingIndex].id,
		};
		return { items };
	}

	if (style.items.length >= 30) {
		throw new Error("Style memory is full. Remove an item before adding another.");
	}

	return { items: [...style.items, nextItem] };
}

export const getResumeStyleTool = createTool({
	id: "get_resume_style",
	description:
		"Read the user's saved resume style memory. Durable writing preferences that apply across chats.",
	inputSchema: z.object({}),
	outputSchema: z.object({
		items: z.array(resumeStyleItemSchema),
	}),
	execute: async (_input, context) => {
		const userId = requireUserId(context?.requestContext);
		const row = await getUserContext(userId);
		return parseResumeStyle(row?.resumeStyle);
	},
});

export const updateResumeStyleTool = createTool({
	id: "update_resume_style",
	description:
		"Save a durable resume writing preference (bullet style, emphasis, density, tone). Use when the user states how they want resumes written going forward. Do not save one-off edits to a single resume. If a preference with the same title exists, it is updated.",
	inputSchema: z.object({
		op: z
			.enum(["upsert", "remove", "clear"])
			.describe(
				"upsert adds or updates a preference, remove deletes one by id, clear wipes all",
			),
		title: z
			.string()
			.max(80)
			.optional()
			.describe("Required for upsert. Short label, e.g. Bullet style"),
		instruction: z
			.string()
			.max(500)
			.optional()
			.describe("Required for upsert. The preference to follow on future resumes"),
		id: z
			.string()
			.optional()
			.describe("Required for remove. Preference id from get_resume_style"),
	}),
	outputSchema: z.object({
		ok: z.boolean(),
		items: z.array(resumeStyleItemSchema),
	}),
	execute: async (input, context) => {
		const userId = requireUserId(context?.requestContext);
		const row = await getUserContext(userId);
		if (!row) {
			throw new Error("Profile not found");
		}

		const current = parseResumeStyle(row.resumeStyle);
		let next: ResumeStyleMemory;
		if (input.op === "upsert") {
			const title = input.title?.trim() ?? "";
			const instruction = input.instruction?.trim() ?? "";
			if (!title || !instruction) {
				throw new Error("upsert requires title and instruction");
			}
			next = upsertStyleItem(current, title, instruction);
		} else if (input.op === "remove") {
			if (!input.id) {
				throw new Error("remove requires id");
			}
			next = {
				items: current.items.filter((item) => item.id !== input.id),
			};
		} else {
			next = { items: [] };
		}

		const updated = await updateUserContextResumeStyle(userId, next);
		if (!updated) {
			throw new Error("Failed to update style memory");
		}

		const saved = parseResumeStyle(updated.resumeStyle);
		const briefing = context?.requestContext?.get("resumeBriefing");
		if (isResumeBriefing(briefing)) {
			context?.requestContext?.set?.("resumeBriefing", {
				...briefing,
				resumeStyle: saved,
			});
		}

		return {
			ok: true,
			items: saved.items,
		};
	},
});
