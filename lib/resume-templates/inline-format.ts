import { escapeHtml } from "@/lib/resume-templates/escape";

export function formatInlineMarkup(value: unknown) {
	const escaped = escapeHtml(String(value ?? ""));
	return escaped
		.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
		.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
}
