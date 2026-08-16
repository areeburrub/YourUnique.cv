import { defineConfig } from "@trigger.dev/sdk/v3";
import { additionalFiles } from "@trigger.dev/build/extensions/core";
import { playwright } from "@trigger.dev/build/extensions/playwright";

export default defineConfig({
	project: "proj_cldbvyftqkvnjngyjhlp",
	runtime: "node",
	logLevel: "log",
	maxDuration: 3600,
	legacyDevProcessCwdBehaviour: false,
	retries: {
		enabledInDev: true,
		default: {
			maxAttempts: 3,
			minTimeoutInMs: 1000,
			maxTimeoutInMs: 10000,
			factor: 2,
			randomize: true,
		},
	},
	dirs: ["trigger"],
	build: {
		external: [
			"playwright",
			"playwright-core",
			"chromium-bidi",
			"pdf-to-img",
			"pdfjs-dist",
			"impit",
		],
		extensions: [
			additionalFiles({
				files: [
					"./templates/resume/**",
					"./mastra/skills/**",
				],
			}),
			playwright({
				browsers: ["chromium"],
				version: "1.57.0",
			}),
		],
	},
});
