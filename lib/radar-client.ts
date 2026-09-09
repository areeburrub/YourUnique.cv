import { getSiteUrl } from "@/lib/site";

export function radarBaseUrl() {
	const url = process.env.RADAR_URL?.trim();
	if (!url) {
		throw new Error("RADAR_URL is not set");
	}
	return url.replace(/\/$/, "");
}

export function radarToken() {
	return process.env.RADAR_TOKEN?.trim() || "";
}

export function radarWebhookSecret() {
	return (
		process.env.RADAR_WEBHOOK_SECRET?.trim() ||
		process.env.RADAR_CALLBACK_SECRET?.trim() ||
		""
	);
}

export function radarCallbackUrl() {
	const override = process.env.RADAR_CALLBACK_URL?.trim();
	if (override) {
		return override.replace(/\/$/, "");
	}
	return `${getSiteUrl()}/api/webhooks/radar`;
}

export async function startRadarMatchRun(input: {
	runId: string;
	userId: string;
	profile: string;
	analyzeN: number;
	exclude: Array<{ source: string; external_id: string }>;
}) {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		Accept: "application/json",
	};
	const token = radarToken();
	if (token) {
		headers["X-Radar-Token"] = token;
	}

	const res = await fetch(`${radarBaseUrl()}/api/match/runs`, {
		method: "POST",
		headers,
		body: JSON.stringify({
			run_id: input.runId,
			user_id: input.userId,
			profile: input.profile,
			analyze_n: input.analyzeN,
			exclude: input.exclude,
			callback_url: radarCallbackUrl(),
		}),
	});

	const text = await res.text();
	let body: { error?: string; status?: string } | null = null;
	if (text) {
		try {
			body = JSON.parse(text) as { error?: string; status?: string };
		} catch {
			body = { error: text };
		}
	}
	if (!res.ok) {
		throw new Error(body?.error || `radar ${res.status}`);
	}
	return body;
}

export async function triggerRadarIngest() {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		Accept: "application/json",
	};
	const token = radarToken();
	if (token) {
		headers["X-Radar-Token"] = token;
	}
	const res = await fetch(`${radarBaseUrl()}/api/ingest`, {
		method: "POST",
		headers,
		body: JSON.stringify({ concurrency: 32 }),
	});
	if (!res.ok && res.status !== 409) {
		const text = await res.text();
		throw new Error(text || `radar ingest ${res.status}`);
	}
}
