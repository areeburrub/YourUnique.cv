import { tasks } from "@trigger.dev/sdk";

import type { sendLifecycleEmail } from "@/trigger/email-automations";

export type EnqueueEmailPayload = {
	alias: string;
	to: string;
	userId?: string;
	dripCycle?: string;
	variables?: Record<string, string>;
	ctaPath?: string;
	ignoreMarketingCap?: boolean;
};

export async function enqueueLifecycleEmail(
	payload: EnqueueEmailPayload,
	options?: { delay?: string },
) {
	if (!process.env.TRIGGER_SECRET_KEY && !process.env.RESEND_API_KEY) {
		return;
	}
	if (!process.env.TRIGGER_SECRET_KEY) {
		if (options?.delay) {
			return;
		}
		const { dispatchTemplateEmail } = await import("@/lib/email/send");
		await dispatchTemplateEmail(payload);
		return;
	}
	await tasks.trigger<typeof sendLifecycleEmail>(
		"send-lifecycle-email",
		payload,
		options?.delay ? { delay: options.delay } : undefined,
	);
}
