import { createOpenRouter } from "@openrouter/ai-sdk-provider";

import { MAX_UPLOAD_FILES } from "@/lib/uploads";

export const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY,
});

export const OPENROUTER_CHAT_MODEL = "openai/gpt-5.6-luna";
export const OPENROUTER_MEMORY_MODEL =
	`openrouter/${OPENROUTER_CHAT_MODEL}` as const;

/** Cheap model for public SEO tools. Short JSON only. */
export const OPENROUTER_TOOLS_MODEL = "google/gemini-2.5-flash-lite";

export const openrouterFileParserPlugins = [
	{
		id: "file-parser" as const,
		max_files: MAX_UPLOAD_FILES,
		pdf: {
			engine: "mistral-ocr" as const,
		},
	},
];
