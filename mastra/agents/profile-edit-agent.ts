import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

import { usageTracker } from "@/mastra/processors/usage-tracker";
import { getProfileTool, patchProfileTool } from "@/mastra/tools/profile-tools";

const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY,
});

export const profileEditAgent = new Agent({
	id: "profile-edit-agent",
	name: "Profile Edit Agent",
	description: `Updates the user's saved career context when they want to add, remove, correct, or change experience, skills, education, summary, contact, projects, or other durable facts. Use this when the user asks to update their resume background or saved details — not for drafting a tailored resume or cover letter.`,
	instructions: `You help the user update their saved career context so future resumes stay accurate.

Speak as the product assistant. Never mention agents, tools, routing, Profile documents, or other internal systems.

Internally you edit a durable markdown career document (contact, summary, experience, education, skills, projects, etc.).

Rules:
- Use get_profile when you need the latest document before editing.
- Apply changes with patch_profile using exact search/replace patches (old_string → new_string). Never send the full document unless a rewrite truly requires replacing a large unique block.
- Keep patches small and unique. Include enough surrounding context in old_string so it matches exactly once.
- You may send multiple patches in one patch_profile call; they apply in order.
- Preserve facts the user did not ask to change. Do not invent employers, dates, or metrics.
- Keep clear markdown headings and bullet lists.
- If the user pastes [Profile context] blocks, treat them as the selected passages they want you to focus on.
- After a successful patch, briefly confirm what changed (1–3 sentences). Do not dump the whole document unless asked.`,
	model: openrouter("anthropic/claude-haiku-4.5"),
	tools: {
		get_profile: getProfileTool,
		patch_profile: patchProfileTool,
	},
	memory: new Memory({
		options: {
			lastMessages: 30,
			generateTitle: {
				model: "openrouter/openai/gpt-5.6-luna",
				instructions: `You write a short sidebar title (3–7 words) for a profile-editing chat.

Rules:
- Base the title only on what the USER asked to change in their career profile.
- Prefer concrete edits (e.g. "Tighten summary", "Add Go skills").
- Do not invent employers, roles, or facts not in the transcript.
- Never answer the user. Return only the title text — no quotes, no punctuation fluff.`,
				minMessages: 2,
			} as {
				model: string;
				instructions: string;
				minMessages: number;
			},
		},
	}),
	outputProcessors: [usageTracker],
});
