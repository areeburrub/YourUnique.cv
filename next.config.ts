import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	serverExternalPackages: ["@mastra/*", "playwright", "handlebars"],
	outputFileTracingIncludes: {
		"/**": ["./templates/resume/**/*", "./mastra/skills/**/*"],
	},
};

export default nextConfig;
