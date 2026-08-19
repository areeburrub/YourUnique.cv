import type { UIMessage } from "ai";

export type ChatAgentId = "app-agent" | "resume-agent" | "profile-edit-agent";

const RESUME_ASK_RE =
	/\bresume\b|\bcv\b|curriculum vitae|(?:tailor|draft|write|create|generate|make|build|compile|update|edit|strengthen|review).{0,48}(?:resume|\bcv\b|pdf)/i;

const JOB_SHARE_RE =
	/linkedin\.com\/jobs|\bjob description\b|\bjob posting\b|\bjob spec\b|\bjob opening\b|\bthe jd\b|\bthis jd\b|\bhere(?:'|’)s the (?:job|role|jd)\b|\bpaste[sd]? (?:the )?(?:job|jd|role)\b/i;

const APPLY_ROLE_RE =
	/\b(?:apply(?:ing)?|applied) (?:for|to)\b|\btarget(?:ing)? (?:role|title|position|job)\b|\bthis (?:role|position|job|opening)(?:\s+at\b)?/i;

const JD_MARKERS = [
	/\bresponsibilities\b/i,
	/\brequirements\b/i,
	/\bqualifications\b/i,
	/\babout the role\b/i,
	/\bwhat you(?:'|’)ll do\b/i,
	/\bwhat we(?:'|’)re looking for\b/i,
	/\bwe are looking for\b/i,
	/\bmust have\b/i,
	/\byears? of experience\b/i,
	/\bpreferred qualifications\b/i,
];

export function lastUserMessageText(messages: UIMessage[]) {
	for (let i = messages.length - 1; i >= 0; i -= 1) {
		const message = messages[i];
		if (message?.role !== "user") {
			continue;
		}
		const text = message.parts
			.filter(
				(part): part is { type: "text"; text: string } =>
					part.type === "text" && typeof part.text === "string",
			)
			.map((part) => part.text)
			.join("\n")
			.trim();
		if (text) {
			return text;
		}
	}
	return "";
}

export function looksLikeJobDescription(text: string) {
	if (text.length < 180) {
		return false;
	}
	let hits = 0;
	for (const marker of JD_MARKERS) {
		if (marker.test(text)) {
			hits += 1;
		}
		if (hits >= 2) {
			return true;
		}
	}
	return false;
}

export function isResumeIntent(text: string) {
	return (
		RESUME_ASK_RE.test(text) ||
		JOB_SHARE_RE.test(text) ||
		APPLY_ROLE_RE.test(text) ||
		looksLikeJobDescription(text)
	);
}

export function resolveChatAgentId(input: {
	chatSurface: "main" | "profile";
	lastUserText: string;
}): ChatAgentId {
	if (isResumeIntent(input.lastUserText)) {
		return "resume-agent";
	}
	return "app-agent";
}
