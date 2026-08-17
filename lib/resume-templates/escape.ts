export function escapeHtml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

export function extractUrlish(value: string) {
	let next = value.trim();
	if (!next) {
		return "";
	}

	const markdown = next.match(/^\[([^\]]*)\]\(([^)]+)\)\s*$/);
	if (markdown) {
		next = (markdown[2] || markdown[1]).trim();
	}

	const href = next.match(/href\s*=\s*["']([^"']+)["']/i);
	if (href) {
		next = href[1].trim();
	}

	const mangled = next.match(/^([^"'<>\s]+)">/);
	if (mangled) {
		next = mangled[1].trim();
	}

	return next;
}

export function stripUrlScheme(value: string) {
	return extractUrlish(value)
		.replace(/^https?:\/\//i, "")
		.replace(/\/$/, "");
}

export function hrefForHostPath(value: string) {
	const trimmed = extractUrlish(value);
	if (!trimmed) {
		return "";
	}
	if (/^(javascript|data|vbscript):/i.test(trimmed)) {
		return "";
	}
	if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("mailto:")) {
		return trimmed;
	}
	if (trimmed.includes("://") || trimmed.startsWith("//")) {
		return "";
	}
	return `https://${trimmed}`;
}
