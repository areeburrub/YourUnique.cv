import { schedules, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

import { runEmailAutomations } from "@/lib/email/automations";
import { dispatchTemplateEmail } from "@/lib/email/send";

export const sendLifecycleEmail = schemaTask({
	id: "send-lifecycle-email",
	schema: z.object({
		alias: z.string().min(1),
		to: z.string().email(),
		userId: z.string().optional(),
		dripCycle: z.string().optional(),
		variables: z.record(z.string(), z.string()).optional(),
		ctaPath: z.string().optional(),
		ignoreMarketingCap: z.boolean().optional(),
	}),
	retry: {
		maxAttempts: 3,
	},
	run: async (payload) => {
		const result = await dispatchTemplateEmail(payload);
		return result;
	},
});

export const emailAutomations = schedules.task({
	id: "email-automations",
	cron: {
		pattern: "20 * * * *",
		timezone: "UTC",
	},
	ttl: "50m",
	run: async () => {
		const counts = await runEmailAutomations();
		return counts;
	},
});
