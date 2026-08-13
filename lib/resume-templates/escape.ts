export function escapeHtml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

export function stripUrlScheme(value: string) {
	return value.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

export function hrefForHostPath(value: string) {
	const trimmed = value.trim();
	if (!trimmed) {
		return "";
	}
	if (/^https?:\/\//i.test(trimmed)) {
		return trimmed;
	}
	if (trimmed.startsWith("mailto:")) {
		return trimmed;
	}
	return `https://${trimmed}`;
}
