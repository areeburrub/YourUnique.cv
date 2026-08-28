import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
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
		return;
	}
	const { error } = await resend.events.send({
		event,
		email: email.trim().toLowerCase(),
		payload,
	});
	if (error) {
		console.error("Resend event failed", event, error.message);
	}
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
		await sendEvent(ResendEvent.TrialStarted, user.email, { name });
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
