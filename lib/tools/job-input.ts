import { extractLinkedInJobId, isLinkedInJobUrl } from "@/lib/linkedin-job-url";

export type ClassifiedJobInput =
	| { kind: "linkedin"; jobId: string; url: string }
	| { kind: "job_url"; url: string }
	| { kind: "text"; text: string };

const URL_TOKEN_RE = /https?:\/\/[^\s]+/i;
const SHORT_PASTE_LIMIT = 500;

function firstUrlToken(text: string) {
	return text.match(URL_TOKEN_RE)?.[0]?.replace(/[),.;]+$/, "") ?? null;
}

function looksLikeHttpUrl(input: string) {
	const trimmed = input.trim();
	if (!trimmed) {
		return null;
	}
	const withProtocol = /^https?:\/\//i.test(trimmed)
		? trimmed
		: `https://${trimmed}`;
	try {
		const url = new URL(withProtocol);
		if (url.protocol !== "http:" && url.protocol !== "https:") {
			return null;
		}
		if (!url.hostname.includes(".")) {
			return null;
		}
		return url.toString();
	} catch {
		return null;
	}
}

export function classifyJobInput(raw: string): ClassifiedJobInput {
	const text = raw.trim();
	const linkedIn =
		extractLinkedInJobId(text) ??
		extractLinkedInJobId(firstUrlToken(text) ?? "");
	if (linkedIn && text.length < SHORT_PASTE_LIMIT) {
		return {
			kind: "linkedin",
			jobId: linkedIn.jobId,
			url: linkedIn.canonicalUrl,
		};
	}

	const urlToken = firstUrlToken(text) ?? text;
	if (text.length < SHORT_PASTE_LIMIT && !isLinkedInJobUrl(urlToken)) {
		const posting = looksLikeHttpUrl(urlToken);
		if (posting) {
			return { kind: "job_url", url: posting };
		}
	}

	return { kind: "text", text };
}

export function isJobInputReady(raw: string) {
	const classified = classifyJobInput(raw);
	if (classified.kind === "linkedin" || classified.kind === "job_url") {
		return true;
	}
	return classified.text.length >= 40;
}

