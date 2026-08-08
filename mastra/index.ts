import { Mastra } from "@mastra/core";
import { PostgresStore } from "@mastra/pg";

import { contextExtractAgent } from "./agents/onboarding/context-extract-agent";
import { profileEditAgent } from "./agents/profile-edit-agent";
import { resumeAgent } from "./agents/resume-agent";
import { onboardingContextWorkflow } from "./workflows/onboarding-context";

const storage = new PostgresStore({
	id: "yourunique-cv",
	connectionString: process.env.DATABASE_URL!,
	schemaName: "mastra",
});

export const mastra = new Mastra({
	agents: {
		resumeAgent,
		contextExtractAgent,
		profileEditAgent,
	},
	workflows: {
		onboardingContextWorkflow,
	},
	storage,
});
