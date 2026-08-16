import type { UIMessage } from "ai";

export type ChatAgentId = "app-agent" | "resume-agent" | "profile-edit-agent";

const RESUME_INTENT_RE =
	/\bresume\b|\bcv\b|curriculum vitae|linkedin\.com\/jobs|(?:tailor|draft|write|create|generate|make|build|compile|update|edit|strengthen|review).{0,48}(?:resume|\bcv\b|pdf)/i;

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

export function isResumeIntent(text: string) {
	return RESUME_INTENT_RE.test(text);
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
