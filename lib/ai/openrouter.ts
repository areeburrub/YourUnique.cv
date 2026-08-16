import { createOpenRouter } from "@openrouter/ai-sdk-provider";

import { MAX_UPLOAD_FILES } from "@/lib/uploads";

export const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY,
});

export const FAST_OPENROUTER_MODEL = "openai/gpt-4.1-mini";
export const FAST_OPENROUTER_MEMORY_MODEL =
	`openrouter/${FAST_OPENROUTER_MODEL}` as const;

export const openrouterFileParserPlugins = [
	{
		id: "file-parser" as const,
		max_files: MAX_UPLOAD_FILES,
		pdf: {
			engine: "mistral-ocr" as const,
		},
	},
];
