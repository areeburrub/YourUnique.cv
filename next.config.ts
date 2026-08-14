import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	serverExternalPackages: ["@mastra/*", "handlebars"],
	outputFileTracingIncludes: {
		"/**": ["./templates/resume/**/*", "./mastra/skills/**/*"],
	},
	outputFileTracingExcludes: {
		"*": [
			"node_modules/playwright/**",
			"node_modules/playwright-core/**",
			"node_modules/chromium-bidi/**",
		],
	},
};

export default nextConfig;
