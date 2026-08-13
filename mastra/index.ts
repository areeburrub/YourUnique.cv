import { Mastra } from "@mastra/core";
import { PostgresStore } from "@mastra/pg";

import { appAgent } from "./agents/app-agent";
import { profileEditAgent } from "./agents/profile-edit-agent";
import { resumeAgent } from "./agents/resume-agent";

const storage = new PostgresStore({
	id: "yourunique-cv",
	connectionString: process.env.DATABASE_URL!,
	schemaName: "mastra",
});

export const mastra = new Mastra({
	agents: {
		appAgent,
		resumeAgent,
		profileEditAgent,
	},
	storage,
});
