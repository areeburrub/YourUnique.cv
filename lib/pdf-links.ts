import { inflateRawSync, inflateSync } from "node:zlib";

export type PdfLink = {
	label: string;
	url: string;
};

const MAX_LINKS = 50;

const INFRA_HOST_SUFFIXES = [
	"adobe.com",
	"acrobat.com",
	"w3.org",
	"googleapis.com",
	"gstatic.com",
	"typekit.net",
	"typekit.com",
	"purl.org",
	"mozilla.org",
];

const INFRA_HOSTS = new Set([
	"schemas.microsoft.com",
	"schemas.openxmlformats.org",
	"ns.adobe.com",
]);

const KNOWN_HOST_LABELS: Array<{ suffix: string; label: string }> = [
	{ suffix: "github.com", label: "GitHub" },
	{ suffix: "gitlab.com", label: "GitLab" },
	{ suffix: "bitbucket.org", label: "Bitbucket" },
	{ suffix: "linkedin.com", label: "LinkedIn" },
	{ suffix: "twitter.com", label: "Twitter" },
	{ suffix: "x.com", label: "Twitter" },
	{ suffix: "medium.com", label: "Medium" },
	{ suffix: "behance.net", label: "Behance" },
	{ suffix: "dribbble.com", label: "Dribbble" },
	{ suffix: "stackoverflow.com", label: "Stack Overflow" },
	{ suffix: "youtube.com", label: "YouTube" },
	{ suffix: "youtu.be", label: "YouTube" },
];

const CONTACT_LABEL_ORDER = [
	"Email",
	"GitHub",
	"LinkedIn",
	"GitLab",
	"Twitter",
	"Website",
];

const URI_LITERAL = /\/URI\s*\(((?:\\.|[^\\)])*)\)/g;
const URI_HEX = /\/URI\s*<([0-9A-Fa-f \t\r\n]+)>/g;
const VISIBLE_URL =
	/(?:https?:\/\/|mailto:)[^\s<>()[\]{}"'\\]+/gi;
const BARE_PROFILE_URL =
	/(?:^|[\s<(])((?:www\.)?(?:github\.com|gitlab\.com|linkedin\.com|twitter\.com|x\.com)\/[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]+)/gi;

function decodePdfLiteralString(value: string) {
	let out = "";
	for (let i = 0; i < value.length; i++) {
		const ch = value[i];
		if (ch !== "\\") {
			out += ch;
			continue;
		}
		const next = value[i + 1];
		if (next === undefined) {
			break;
		}
		if (next === "n") {
			out += "\n";
			i += 1;
			continue;
		}
		if (next === "r") {
			out += "\r";
			i += 1;
			continue;
		}
		if (next === "t") {
			out += "\t";
			i += 1;
			continue;
		}
		if (next === "b") {
			out += "\b";
			i += 1;
			continue;
		}
		if (next === "f") {
			out += "\f";
			i += 1;
			continue;
		}
		if (next === "(" || next === ")" || next === "\\") {
			out += next;
			i += 1;
			continue;
		}
		if (next === "\n") {
			i += 1;
			continue;
		}
		if (next === "\r") {
			i += value[i + 2] === "\n" ? 2 : 1;
			continue;
		}
		if (next >= "0" && next <= "7") {
			let oct = next;
			let consumed = 1;
			const second = value[i + 2];
			if (second >= "0" && second <= "7") {
				oct += second;
				consumed += 1;
				const third = value[i + 3];
				if (third >= "0" && third <= "7") {
					oct += third;
					consumed += 1;
				}
			}
			out += String.fromCharCode(Number.parseInt(oct, 8));
			i += consumed;
			continue;
		}
		out += next;
		i += 1;
	}
	return out;
}

function decodePdfHexString(value: string) {
	const hex = value.replace(/\s+/g, "");
	const padded = hex.length % 2 === 1 ? `${hex}0` : hex;
	try {
		return Buffer.from(padded, "hex").toString("utf8");
	} catch {
		return "";
	}
}

function hostnameOf(url: URL) {
	return url.hostname.replace(/^www\./i, "").toLowerCase();
}

function isInfraHost(hostname: string) {
	const host = hostname.replace(/^www\./i, "").toLowerCase();
	if (INFRA_HOSTS.has(host)) {
		return true;
	}
	return INFRA_HOST_SUFFIXES.some(
		(suffix) => host === suffix || host.endsWith(`.${suffix}`),
	);
}

function trimUrlJunk(raw: string) {
	return raw
		.trim()
		.replace(/[.,;:!?]+$/g, "")
		.replace(/\/+$/, "");
}

function normalizeExtractedUrl(raw: string): string | null {
	let next = trimUrlJunk(raw);
	if (!next || /^(javascript|data|vbscript):/i.test(next)) {
		return null;
	}

	if (next.toLowerCase().startsWith("mailto:")) {
		const email = next.slice("mailto:".length).trim();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return null;
		}
		return `mailto:${email}`;
	}

	if (!/^https?:\/\//i.test(next)) {
		if (
			/^(www\.)?(github\.com|gitlab\.com|linkedin\.com|twitter\.com|x\.com)\//i.test(
				next,
			)
		) {
			next = `https://${next.replace(/^www\./i, "")}`;
		} else {
			return null;
		}
	}

	try {
		const url = new URL(next);
		if (url.protocol !== "http:" && url.protocol !== "https:") {
			return null;
		}
		if (isInfraHost(url.hostname)) {
			return null;
		}
		url.hash = "";
		if (url.protocol === "http:") {
			url.protocol = "https:";
		}
		return url.toString().replace(/\/$/, "");
	} catch {
		return null;
	}
}

function labelForUrl(url: string) {
	if (url.toLowerCase().startsWith("mailto:")) {
		return "Email";
	}
	try {
		const parsed = new URL(url);
		const host = hostnameOf(parsed);
		const known = KNOWN_HOST_LABELS.find(
			(entry) => host === entry.suffix || host.endsWith(`.${entry.suffix}`),
		);
		if (known) {
			return known.label;
		}
		if (
			parsed.pathname === "/" ||
			parsed.pathname === ""
		) {
			return "Website";
		}
		return host || "Website";
	} catch {
		return "Website";
	}
}

function linkSortRank(link: PdfLink) {
	const index = CONTACT_LABEL_ORDER.indexOf(link.label);
	return index === -1 ? CONTACT_LABEL_ORDER.length : index;
}

function collectFromText(text: string, urls: Set<string>) {
	for (const match of text.matchAll(URI_LITERAL)) {
		const decoded = decodePdfLiteralString(match[1] ?? "");
		const url = normalizeExtractedUrl(decoded);
		if (url) {
			urls.add(url);
		}
	}
	for (const match of text.matchAll(URI_HEX)) {
		const decoded = decodePdfHexString(match[1] ?? "");
		const url = normalizeExtractedUrl(decoded);
		if (url) {
			urls.add(url);
		}
	}
	for (const match of text.matchAll(VISIBLE_URL)) {
		const url = normalizeExtractedUrl(match[0] ?? "");
		if (url) {
			urls.add(url);
		}
	}
	for (const match of text.matchAll(BARE_PROFILE_URL)) {
		const url = normalizeExtractedUrl(match[1] ?? "");
		if (url) {
			urls.add(url);
		}
	}
}

function tryInflate(data: Buffer) {
	if (data.length < 2) {
		return null;
	}
	try {
		return inflateSync(data);
	} catch {
		try {
			return inflateRawSync(data);
		} catch {
			return null;
		}
	}
}

function visitPdfStreams(latin1: string, visit: (text: string) => void) {
	let index = 0;
	while (index < latin1.length) {
		const start = latin1.indexOf("stream", index);
		if (start === -1) {
			return;
		}
		const before = start === 0 ? "" : latin1[start - 1];
		if (before && /[A-Za-z]/.test(before)) {
			index = start + 6;
			continue;
		}
		let dataStart = start + 6;
		if (latin1[dataStart] === "\r") {
			dataStart += 1;
		}
		if (latin1[dataStart] === "\n") {
			dataStart += 1;
		}
		const end = latin1.indexOf("endstream", dataStart);
		if (end === -1) {
			return;
		}
		let raw = Buffer.from(latin1.slice(dataStart, end), "latin1");
		if (raw.length > 0 && raw[raw.length - 1] === 0x0a) {
			raw = raw.subarray(0, raw.length - 1);
			if (raw.length > 0 && raw[raw.length - 1] === 0x0d) {
				raw = raw.subarray(0, raw.length - 1);
			}
		}
		const inflated = tryInflate(raw);
		if (inflated && inflated.length > 0) {
			visit(inflated.toString("latin1"));
		}
		index = end + 9;
	}
}

export function extractPdfLinks(bytes: Uint8Array): PdfLink[] {
	try {
		if (bytes.byteLength === 0) {
			return [];
		}

		const latin1 = Buffer.from(bytes).toString("latin1");
		const urls = new Set<string>();
		collectFromText(latin1, urls);
		visitPdfStreams(latin1, (text) => collectFromText(text, urls));

		return [...urls]
			.map((url) => ({ label: labelForUrl(url), url }))
			.sort((a, b) => {
				const rank = linkSortRank(a) - linkSortRank(b);
				if (rank !== 0) {
					return rank;
				}
				return a.url.localeCompare(b.url);
			})
			.slice(0, MAX_LINKS);
	} catch {
		return [];
	}
}

export function formatPdfLinksForModel(
	links: PdfLink[],
	filename?: string,
) {
	if (links.length === 0) {
		return "";
	}
	const source = filename ? ` from "${filename}"` : "";
	const lines = links.map((link) => `- [${link.label}](${link.url})`);
	return `Links extracted from the resume PDF${source} (including clickable links whose URL is not printed on the page). Put every candidate contact or project URL into the profile. Prefer these exact URLs over guessing.

${lines.join("\n")}`;
}
