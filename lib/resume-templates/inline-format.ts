import { formatDateValue, looksLikeDate } from "@/lib/resume-templates/dates";
import { escapeHtml } from "@/lib/resume-templates/escape";

function unescapeHtml(value: string) {
	return value
		.replaceAll("&amp;", "&")
		.replaceAll("&lt;", "<")
		.replaceAll("&gt;", ">")
		.replaceAll("&quot;", '"')
		.replaceAll("&#39;", "'");
}

function safeHref(escapedUrl: string) {
	const url = unescapeHtml(escapedUrl).trim();
	if (
		!url ||
		/^javascript:/i.test(url) ||
		/^data:/i.test(url) ||
		/^vbscript:/i.test(url)
	) {
		return null;
	}
	if (/^https?:\/\//i.test(url) || /^mailto:/i.test(url)) {
		return escapeHtml(url);
	}
	if (url.includes("://") || url.startsWith("//")) {
		return null;
	}
	return escapeHtml(`https://${url}`);
}

export function formatInlineMarkup(value: unknown) {
	const text = looksLikeDate(value) ? formatDateValue(value) : value;
	const escaped = escapeHtml(String(text ?? ""));
	return escaped
		.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
		.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>")
		.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label: string, url: string) => {
			const href = safeHref(url);
			if (!href) {
				return label;
			}
			return `<a href="${href}">${label}</a>`;
		});
}
