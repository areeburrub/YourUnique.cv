import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "@/lib/db";
import {
	emailSends,
	emailUnsubscribes,
	users,
} from "@/lib/db/schema";
import {
	EMAIL_TEMPLATE_BY_ALIAS,
	type EmailPreference,
} from "@/lib/email/catalog";
import { sendResendTemplate } from "@/lib/email/resend";
import { unsubscribeUrl } from "@/lib/email/tokens";
import { getSiteUrl } from "@/lib/site";

const DAY_MS = 24 * 60 * 60 * 1000;

export type DispatchEmailInput = {
	alias: string;
	to: string;
	userId?: string | null;
	dripCycle?: string;
	variables?: Record<string, string>;
	ctaPath?: string;
	ignoreMarketingCap?: boolean;
};

function preferenceAllowed(
	preference: EmailPreference,
	user: {
		emailRemindersEnabled: boolean;
	} | null,
) {
	if (preference === "important") {
		return true;
	}
	if (!user) {
		return true;
	}
	return user.emailRemindersEnabled;
}

function isUniqueViolation(error: unknown) {
	const record = error as {
		code?: string;
		cause?: { code?: string };
		message?: string;
	};
	return (
		record.code === "23505" ||
		record.cause?.code === "23505" ||
		/duplicate key|unique constraint/i.test(record.message ?? "")
	);
}

export async function dispatchTemplateEmail(input: DispatchEmailInput) {
	const template = EMAIL_TEMPLATE_BY_ALIAS[input.alias];
	if (!template) {
		return { ok: false as const, reason: "unknown_template" };
	}

	const email = input.to.trim().toLowerCase();
	const dripCycle = input.dripCycle ?? "once";
	const unsubscribed = await db.query.emailUnsubscribes.findFirst({
		where: eq(emailUnsubscribes.email, email),
	});
	if (unsubscribed && template.preference === "promotional") {
		return { ok: false as const, reason: "unsubscribed" };
	}

	const user = input.userId
		? await db.query.users.findFirst({
				where: eq(users.id, input.userId),
			})
		: await db.query.users.findFirst({
				where: eq(users.email, email),
			});

	if (!preferenceAllowed(template.preference, user ?? null)) {
		return { ok: false as const, reason: "preference_off" };
	}

	const isMarketing = template.preference === "promotional";
	if (
		isMarketing &&
		!input.ignoreMarketingCap &&
		user?.lastMarketingEmailAt &&
		Date.now() - user.lastMarketingEmailAt.getTime() < DAY_MS
	) {
		return { ok: false as const, reason: "rate_limited" };
	}

	try {
		await db.insert(emailSends).values({
			id: nanoid(),
			userId: user?.id ?? input.userId ?? null,
			email,
			templateAlias: input.alias,
			dripCycle,
		});
	} catch (error) {
		if (isUniqueViolation(error)) {
			return { ok: false as const, reason: "already_sent" };
		}
		throw error;
	}

	const ctaUrl = new URL(input.ctaPath ?? "/new-chat", getSiteUrl()).toString();
	const variables = {
		NAME: user?.firstName?.trim() || "there",
		CTA_URL: ctaUrl,
		UNSUBSCRIBE_URL: unsubscribeUrl({
			email,
			userId: user?.id,
		}),
		...input.variables,
	};

	try {
		await sendResendTemplate({
			alias: input.alias,
			to: email,
			variables,
		});
	} catch (error) {
		await db
			.delete(emailSends)
			.where(
				and(
					eq(emailSends.email, email),
					eq(emailSends.templateAlias, input.alias),
					eq(emailSends.dripCycle, dripCycle),
				),
			);
		throw error;
	}

	if (user && isMarketing) {
		await db
			.update(users)
			.set({
				lastMarketingEmailAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(users.id, user.id));
	}

	return { ok: true as const };
}
