const SITEVERIFY_URL =
	"https://challenges.cloudflare.com/turnstile/v0/siteverify";

type SiteverifyResponse = {
	success?: boolean;
	"error-codes"?: string[];
};

export function getTurnstileSiteKey() {
	return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
}

export async function verifyTurnstileToken(input: {
	token: string;
	ip?: string | null;
}) {
	const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
	if (!secret) {
		return { ok: false as const, error: "Bot check is not configured" };
	}

	const token = input.token.trim();
	if (!token) {
		return {
			ok: false as const,
			error: "Complete the bot check before running the tool",
		};
	}

	const body = new URLSearchParams();
	body.set("secret", secret);
	body.set("response", token);
	if (input.ip) {
		body.set("remoteip", input.ip);
	}

	const response = await fetch(SITEVERIFY_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body,
	});

	let data: SiteverifyResponse;
	try {
		data = (await response.json()) as SiteverifyResponse;
	} catch {
		return {
			ok: false as const,
			error: "Could not verify the bot check. Try again.",
		};
	}

	if (!data.success) {
		return {
			ok: false as const,
			error: "Bot check failed. Refresh the widget and try again.",
		};
	}

	return { ok: true as const };
}

export function clientIpFromHeaders(headers: Headers) {
	const forwarded = headers.get("x-forwarded-for");
	if (forwarded) {
		const first = forwarded.split(",")[0]?.trim();
		if (first) {
			return first;
		}
	}
	return (
		headers.get("cf-connecting-ip")?.trim() ||
		headers.get("x-real-ip")?.trim() ||
		null
	);
}
