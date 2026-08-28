import { Resend } from "resend";

import {
	EMAIL_FROM,
	EMAIL_REPLY_TO,
	EMAIL_TEMPLATE_BY_ALIAS,
	TEMPLATE_VARIABLES,
} from "@/lib/email/catalog";

let client: Resend | null = null;

export function getResendClient() {
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) {
		return null;
	}
	if (!client) {
		client = new Resend(apiKey);
	}
	return client;
}

export type SendTemplateInput = {
	alias: string;
	to: string;
	variables?: Record<string, string>;
};

export async function sendResendTemplate(input: SendTemplateInput) {
	const resend = getResendClient();
	if (!resend) {
		throw new Error("RESEND_API_KEY is not set");
	}
	const template = EMAIL_TEMPLATE_BY_ALIAS[input.alias];
	if (!template) {
		throw new Error(`Unknown email template: ${input.alias}`);
	}

	const variables: Record<string, string> = {};
	for (const variable of TEMPLATE_VARIABLES) {
		variables[variable.key] =
			input.variables?.[variable.key] ?? variable.fallbackValue;
	}

	const subject = template.subject.replace(
		/\{\{\{(\w+)\}\}\}/g,
		(_, key: string) => variables[key] ?? "",
	);

	const { data, error } = await resend.emails.send({
		from: EMAIL_FROM,
		to: input.to,
		replyTo: EMAIL_REPLY_TO,
		subject,
		template: {
			id: template.alias,
			variables,
		},
	});

	if (error) {
		throw new Error(error.message);
	}
	return data;
}
