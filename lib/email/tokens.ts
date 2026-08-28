import { createHmac, timingSafeEqual } from "node:crypto";

import { getSiteUrl } from "@/lib/site";

type UnsubscribePayload = {
	email: string;
	userId?: string;
};

function signingSecret() {
	return (
		process.env.EMAIL_SIGNING_SECRET ||
		process.env.RESEND_API_KEY ||
		process.env.CLERK_SECRET_KEY ||
		"yourunique-email-dev"
	);
}

function encode(value: string) {
	return Buffer.from(value).toString("base64url");
}

function decode(value: string) {
	return Buffer.from(value, "base64url").toString("utf8");
}

export function createUnsubscribeToken(payload: UnsubscribePayload) {
	const body = encode(JSON.stringify(payload));
	const sig = createHmac("sha256", signingSecret()).update(body).digest("base64url");
	return `${body}.${sig}`;
}

export function parseUnsubscribeToken(token: string): UnsubscribePayload | null {
	const [body, sig] = token.split(".");
	if (!body || !sig) {
		return null;
	}
	const expected = createHmac("sha256", signingSecret())
		.update(body)
		.digest("base64url");
	const a = Buffer.from(sig);
	const b = Buffer.from(expected);
	if (a.length !== b.length || !timingSafeEqual(a, b)) {
		return null;
	}
	try {
		const parsed = JSON.parse(decode(body)) as UnsubscribePayload;
		if (!parsed.email || typeof parsed.email !== "string") {
			return null;
		}
		return parsed;
	} catch {
		return null;
	}
}

export function unsubscribeUrl(payload: UnsubscribePayload) {
	const url = new URL("/unsubscribe", getSiteUrl());
	url.searchParams.set("token", createUnsubscribeToken(payload));
	return url.toString();
}
