import { Mastra } from "@mastra/core";
import { PostgresStore } from "@mastra/pg";

import { classifyDocsAgent } from "./agents/onboarding/classify-docs-agent";
import { profileEditAgent } from "./agents/profile-edit-agent";
import { profileExtractAgent } from "./agents/onboarding/profile-extract-agent";
import { resumeAgent } from "./agents/resume-agent";
import { styleExtractAgent } from "./agents/onboarding/style-extract-agent";
import { onboardingContextWorkflow } from "./workflows/onboarding-context";

const storage = new PostgresStore({
	id: "yourunique-cv",
	connectionString: process.env.DATABASE_URL!,
	schemaName: "mastra",
});

export const mastra = new Mastra({
	agents: {
		resumeAgent,
		classifyDocsAgent,
		profileExtractAgent,
		styleExtractAgent,
		profileEditAgent,
	},
	workflows: {
		onboardingContextWorkflow,
	},
	storage,
});


