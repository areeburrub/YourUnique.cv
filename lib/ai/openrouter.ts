import { createOpenRouter } from "@openrouter/ai-sdk-provider";

import { MAX_UPLOAD_FILES } from "@/lib/uploads";

export const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY,
});

export const openrouterFileParserPlugins = [
	{
		id: "file-parser" as const,
		max_files: MAX_UPLOAD_FILES,
		pdf: {
			engine: "pdf-text" as const,
		},
	},
];
