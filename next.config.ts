import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	serverExternalPackages: ["@mastra/*"],
	outputFileTracingIncludes: {
		"/**": ["./templates/resume/**/*", "./mastra/skills/**/*"],
	},
};

export default nextConfig;
