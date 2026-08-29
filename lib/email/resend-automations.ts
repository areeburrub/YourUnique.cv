import type {
	AutomationConnection,
	AutomationStep,
	CreateAutomationOptions,
	EventSchemaMap,
} from "resend";

import { EMAIL_FROM, EMAIL_REPLY_TO, QUIET_DRIP_ALIASES } from "@/lib/email/catalog";
import { checkoutPath } from "@/lib/plans";
import { getSiteUrl } from "@/lib/site";

export const ResendEvent = {
	SignedUp: "yucv.user.signed_up",
	OnboardingCompleted: "yucv.onboarding.completed",
	Activity: "yucv.user.activity",
	ResumeCreated: "yucv.resume.created",
	TrialStarted: "yucv.trial.started",
	PlanPaid: "yucv.plan.paid",
	LeadCaptured: "yucv.lead.captured",
	DailyLimit: "yucv.usage.daily_limit",
	MonthlyLimit: "yucv.usage.monthly_limit",
} as const;

export type ResendEventName = (typeof ResendEvent)[keyof typeof ResendEvent];

const nameSchema = { name: "string" } as const satisfies EventSchemaMap;

export const RESEND_EVENT_DEFS: {
	name: ResendEventName;
	schema: EventSchemaMap;
}[] = [
	{ name: ResendEvent.SignedUp, schema: nameSchema },
	{ name: ResendEvent.OnboardingCompleted, schema: nameSchema },
	{ name: ResendEvent.Activity, schema: nameSchema },
	{ name: ResendEvent.ResumeCreated, schema: nameSchema },
	{ name: ResendEvent.TrialStarted, schema: nameSchema },
	{ name: ResendEvent.PlanPaid, schema: nameSchema },
	{
		name: ResendEvent.LeadCaptured,
		schema: { name: "string", score: "string" },
	},
	{ name: ResendEvent.DailyLimit, schema: nameSchema },
	{ name: ResendEvent.MonthlyLimit, schema: nameSchema },
];

function sitePath(path: string) {
	return new URL(path, `${getSiteUrl()}/`).toString();
}

function sendEmail(
	key: string,
	alias: string,
	ctaPath: string,
	extra?: Record<string, string | { var: string }>,
): AutomationStep {
	return {
		key,
		type: "send_email",
		config: {
			from: EMAIL_FROM,
			replyTo: EMAIL_REPLY_TO,
			template: {
				id: alias,
				variables: {
					NAME: { var: "event.name" },
					CTA_URL: sitePath(ctaPath),
					...extra,
				},
			},
		},
	};
}

function waitFor(
	key: string,
	eventName: string,
	timeout: string,
): AutomationStep {
	return {
		key,
		type: "wait_for_event",
		config: { eventName, timeout },
	};
}

type Graph = Pick<CreateAutomationOptions, "name" | "steps" | "connections">;

function sendOnEvent(input: {
	name: string;
	trigger: string;
	alias: string;
	ctaPath: string;
}): Graph {
	return {
		name: input.name,
		steps: [
			{
				key: "start",
				type: "trigger",
				config: { eventName: input.trigger },
			},
			sendEmail("send", input.alias, input.ctaPath),
		],
		connections: [{ from: "start", to: "send", type: "default" }],
	};
}

function dripAfterWait(input: {
	name: string;
	trigger: string;
	waitEvent: string;
	timeout: string;
	alias: string;
	ctaPath: string;
	extra?: Record<string, string | { var: string }>;
}): Graph {
	return {
		name: input.name,
		steps: [
			{
				key: "start",
				type: "trigger",
				config: { eventName: input.trigger },
			},
			waitFor("wait", input.waitEvent, input.timeout),
			sendEmail("send", input.alias, input.ctaPath, input.extra),
		],
		connections: [
			{ from: "start", to: "wait", type: "default" },
			{ from: "wait", to: "send", type: "timeout" },
		],
	};
}

function quietDrip(): Graph {
	const steps: AutomationStep[] = [
		{
			key: "start",
			type: "trigger",
			config: { eventName: ResendEvent.Activity },
		},
	];
	const connections: AutomationConnection[] = [];
	let previous = "start";
	const timeouts = ["2 days", ...Array.from({ length: 9 }, () => "1 day")];

	timeouts.forEach((timeout, index) => {
		const waitKey = `wait_${index + 1}`;
		const sendKey = `q${index + 1}`;
		const alias = QUIET_DRIP_ALIASES[index];
		steps.push(waitFor(waitKey, ResendEvent.Activity, timeout));
		steps.push(sendEmail(sendKey, alias, "/new-chat"));
		connections.push({ from: previous, to: waitKey, type: "default" });
		connections.push({ from: waitKey, to: sendKey, type: "timeout" });
		previous = sendKey;
	});

	return {
		name: "YUCV Quiet drip",
		steps,
		connections,
	};
}

export function resendAutomationGraphs(): Graph[] {
	return [
		dripAfterWait({
			name: "YUCV Onboarding stuck",
			trigger: ResendEvent.SignedUp,
			waitEvent: ResendEvent.OnboardingCompleted,
			timeout: "2 hours",
			alias: "yucv-onboarding-stuck",
			ctaPath: "/onboarding",
		}),
		dripAfterWait({
			name: "YUCV First job",
			trigger: ResendEvent.OnboardingCompleted,
			waitEvent: ResendEvent.ResumeCreated,
			timeout: "16 hours",
			alias: "yucv-first-job",
			ctaPath: "/new-chat",
		}),
		quietDrip(),
		sendOnEvent({
			name: "YUCV Daily limit",
			trigger: ResendEvent.DailyLimit,
			alias: "yucv-limit-daily",
			ctaPath: checkoutPath(),
		}),
		sendOnEvent({
			name: "YUCV Monthly limit",
			trigger: ResendEvent.MonthlyLimit,
			alias: "yucv-limit-monthly",
			ctaPath: checkoutPath(),
		}),
		dripAfterWait({
			name: "YUCV Lead follow-up",
			trigger: ResendEvent.LeadCaptured,
			waitEvent: ResendEvent.SignedUp,
			timeout: "1 hour",
			alias: "yucv-lead-score",
			ctaPath: "/sign-up?from=email-lead",
			extra: { SCORE: { var: "event.score" } },
		}),
	];
}
