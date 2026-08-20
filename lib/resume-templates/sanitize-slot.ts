import { escapeHtml, hrefForHostPath } from "@/lib/resume-templates/escape";

const TOKEN = "\u0000";

function normalizeAllowedTag(match: string): string {
	const tag = match.toLowerCase().replace(/\s+/g, "");
	if (tag === "<b>" || tag === "<b/>") {
		return "<strong>";
	}
	if (tag === "</b>") {
		return "</strong>";
	}
	if (tag === "<i>" || tag === "<i/>") {
		return "<em>";
	}
	if (tag === "</i>") {
		return "</em>";
	}
	return tag;
}

export function sanitizeSlotHtml(raw: string): string {
	if (!raw) {
		return "";
	}

	const tokens: string[] = [];
	let skipCloseA = 0;
	const replaced = raw.replace(
		/<\/?(?:strong|em|b|i)\s*>|<a\s+href\s*=\s*(["'])(.*?)\1\s*>|<\/a>/gi,
		(match, _quote?: string, href?: string) => {
			if (href != null) {
				const safe = hrefForHostPath(href);
				if (!safe) {
					skipCloseA += 1;
					return "";
				}
				tokens.push(`<a href="${escapeHtml(safe)}">`);
				return `${TOKEN}${tokens.length - 1}${TOKEN}`;
			}
			if (/^<\/a>/i.test(match)) {
				if (skipCloseA > 0) {
					skipCloseA -= 1;
					return "";
				}
				tokens.push("</a>");
				return `${TOKEN}${tokens.length - 1}${TOKEN}`;
			}
			if (match.toLowerCase().startsWith("<a")) {
				skipCloseA += 1;
				return "";
			}
			tokens.push(normalizeAllowedTag(match));
			return `${TOKEN}${tokens.length - 1}${TOKEN}`;
		},
	);

	return escapeHtml(replaced).replace(
		new RegExp(`${TOKEN}(\\d+)${TOKEN}`, "g"),
		(_, index: string) => tokens[Number(index)] ?? "",
	);
}
