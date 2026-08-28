import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "@/lib/db";
import { emailSends, resumes, users } from "@/lib/db/schema";
import { getResendClient } from "@/lib/email/resend";
import {
	ResendEvent,
	type ResendEventName,
} from "@/lib/email/resend-automations";

type ContactInput = {
	email: string;
	firstName?: string | null;
	lastName?: string | null;
	promotionalEnabled?: boolean;
};

function eventName(user: { firstName?: string | null; email: string }) {
	return user.firstName?.trim() || "there";
}

async function upsertContact(input: ContactInput) {
	const resend = getResendClient();
	if (!resend) {
		return;
	}
	const email = input.email.trim().toLowerCase();
	const payload = {
		email,
		firstName: input.firstName?.trim() || undefined,
		lastName: input.lastName?.trim() || undefined,
		unsubscribed: input.promotionalEnabled === false,
	};
	const created = await resend.contacts.create(payload);
	if (!created.error) {
		return;
	}
	await resend.contacts.update({
		email,
		firstName: payload.firstName,
		lastName: payload.lastName,
		unsubscribed: payload.unsubscribed,
	});
}

async function sendEvent(
	event: ResendEventName,
	email: string,
	payload: Record<string, unknown> = {},
) {
	const resend = getResendClient();
	if (!resend) {
		return false;
	}
	const { error } = await resend.events.send({
		event,
		email: email.trim().toLowerCase(),
		payload,
	});
	if (error) {
		console.error("Resend event failed", event, error.message);
		return false;
	}
	return true;
}

function runInBackground(work: () => Promise<void>) {
	void work().catch((error) => {
		console.error("Resend lifecycle failed", error);
	});
}

export async function setResendPromotionalPreference(
	email: string,
	enabled: boolean,
) {
	runInBackground(() =>
		upsertContact({ email, promotionalEnabled: enabled }),
	);
}

export function notifyUserSignedUp(user: {
	email: string;
	firstName?: string | null;
	lastName?: string | null;
	emailRemindersEnabled?: boolean;
}) {
	runInBackground(async () => {
		const name = eventName(user);
		await upsertContact({
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			promotionalEnabled: user.emailRemindersEnabled ?? true,
		});
		await sendEvent(ResendEvent.SignedUp, user.email, { name });
	});
}

export function notifyOnboardingCompleted(user: {
	id: string;
	email: string;
	firstName?: string | null;
}) {
	runInBackground(async () => {
		const name = eventName(user);
		await sendEvent(ResendEvent.OnboardingCompleted, user.email, { name });
		await sendEvent(ResendEvent.Activity, user.email, { name });
		const resume = await db.query.resumes.findFirst({
			where: eq(resumes.userId, user.id),
			columns: { id: true },
		});
		if (resume) {
			await sendEvent(ResendEvent.ResumeCreated, user.email, { name });
		}
	});
}

export function notifyUserActivity(user: {
	email: string;
	firstName?: string | null;
}) {
	runInBackground(async () => {
		await sendEvent(ResendEvent.Activity, user.email, {
			name: eventName(user),
		});
	});
}

export function notifyResumeCreated(user: {
	email: string;
	firstName?: string | null;
}) {
	runInBackground(async () => {
		await sendEvent(ResendEvent.ResumeCreated, user.email, {
			name: eventName(user),
		});
	});
}

export function notifyPlanPaid(user: {
	email: string;
	firstName?: string | null;
}) {
	runInBackground(async () => {
		await sendEvent(ResendEvent.PlanPaid, user.email, {
			name: eventName(user),
		});
	});
}

export function notifyLeadCaptured(input: {
	email: string;
	name?: string | null;
	score: string;
}) {
	runInBackground(async () => {
		const firstName = input.name?.trim().split(/\s+/)[0] || "there";
		await upsertContact({
			email: input.email,
			firstName,
			promotionalEnabled: true,
		});
		await sendEvent(ResendEvent.LeadCaptured, input.email, {
			name: firstName,
			score: input.score,
		});
	});
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

async function claimLimitEmail(input: {
	userId: string;
	email: string;
	alias: string;
	dripCycle: string;
}) {
	try {
		await db.insert(emailSends).values({
			id: nanoid(),
			userId: input.userId,
			email: input.email,
			templateAlias: input.alias,
			dripCycle: input.dripCycle,
		});
		return true;
	} catch (error) {
		if (isUniqueViolation(error)) {
			return false;
		}
		throw error;
	}
}

export function notifyUsageLimitHit(
	userId: string,
	scope: "daily" | "monthly",
) {
	runInBackground(async () => {
		const user = await db.query.users.findFirst({
			where: eq(users.id, userId),
			columns: {
				id: true,
				email: true,
				firstName: true,
			},
		});
		if (!user?.email) {
			return;
		}
		const now = new Date();
		const date = now.toISOString().slice(0, 10);
		const month = date.slice(0, 7);
		const alias =
			scope === "daily" ? "yucv-limit-daily" : "yucv-limit-monthly";
		const claimed = await claimLimitEmail({
			userId: user.id,
			email: user.email.trim().toLowerCase(),
			alias,
			dripCycle: scope === "daily" ? date : month,
		});
		if (!claimed) {
			return;
		}
		const sent = await sendEvent(
			scope === "daily"
				? ResendEvent.DailyLimit
				: ResendEvent.MonthlyLimit,
			user.email,
			{ name: eventName(user) },
		);
		if (!sent) {
			await db
				.delete(emailSends)
				.where(
					and(
						eq(emailSends.email, user.email.trim().toLowerCase()),
						eq(emailSends.templateAlias, alias),
						eq(
							emailSends.dripCycle,
							scope === "daily" ? date : month,
						),
					),
				);
		}
	});
}
