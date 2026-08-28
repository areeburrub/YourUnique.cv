export type EnqueueEmailPayload = {
	alias: string;
	to: string;
	userId?: string;
	dripCycle?: string;
	variables?: Record<string, string>;
	ctaPath?: string;
	ignoreMarketingCap?: boolean;
};

function scheduledAtFromDelay(delay?: string) {
	if (!delay) {
		return undefined;
	}
	if (delay === "15m") {
		return "in 15 minutes";
	}
	if (delay === "1h") {
		return "in 1 hour";
	}
	return delay.startsWith("in ") ? delay : undefined;
}

export async function enqueueLifecycleEmail(
	payload: EnqueueEmailPayload,
	options?: { delay?: string },
) {
	if (!process.env.RESEND_API_KEY) {
		return;
	}
	const { dispatchTemplateEmail } = await import("@/lib/email/send");
	await dispatchTemplateEmail({
		...payload,
		scheduledAt: scheduledAtFromDelay(options?.delay),
	});
}
