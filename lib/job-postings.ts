import { lookup } from "node:dns/promises";
import * as cheerio from "cheerio";

export type JobPostingDetails = {
	url: string;
	title: string;
	company: string;
	location: string;
	description: string;
};

const MIN_DESCRIPTION_LENGTH = 80;
const JD_HINT_RE =
	/responsibilities|requirements|qualifications|about the role|about this (?:job|role)|what you.?ll do|what we.?re looking for|we are looking for|must have|years? of experience|preferred qualifications|job description|the role|you will/i;

const BLOCKED_HOST_RE =
	/^(localhost|.*\.localhost|.*\.local|.*\.internal|.*\.lan|metadata\.google\.internal)$/i;

function decodeHtmlEntities(text: string) {
	return text
		.replace(/&nbsp;/gi, " ")
		.replace(/&amp;/gi, "&")
		.replace(/&lt;/gi, "<")
		.replace(/&gt;/gi, ">")
		.replace(/&quot;/gi, '"')
		.replace(/&#39;/gi, "'")
		.replace(/&#x27;/gi, "'")
		.replace(/&#(\d+);/g, (_, code) =>
			String.fromCharCode(Number(code)),
		);
}

function htmlToReadableText(html: string) {
	const $ = cheerio.load(`<div id="__root">${html}</div>`);
	const root = $("#__root");

	root.find("script, style, noscript, svg, nav, footer, header").remove();
	root.find("br").replaceWith("\n");
	root.find("p, div, h1, h2, h3, h4, h5, h6, section, li").each((_, el) => {
		const node = $(el);
		const text = node.text();
		if (el.tagName === "li") {
			node.replaceWith(`\n- ${text.trim()}\n`);
		} else {
			node.replaceWith(`\n${text.trim()}\n`);
		}
	});

	return decodeHtmlEntities(root.text())
		.replace(/\r\n/g, "\n")
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.replace(/[ \t]{2,}/g, " ")
		.trim();
}

function cleanText(value: string | undefined | null) {
	if (!value) {
		return "";
	}
	return decodeHtmlEntities(value).replace(/\s+/g, " ").trim();
}

function ipv4ToInt(ip: string) {
	const parts = ip.split(".").map((part) => Number(part));
	if (
		parts.length !== 4 ||
		parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)
	) {
		return null;
	}
	return (
		((parts[0]! << 24) |
			(parts[1]! << 16) |
			(parts[2]! << 8) |
			parts[3]!) >>>
		0
	);
}

function isPrivateIPv4(ip: string) {
	const n = ipv4ToInt(ip);
	if (n === null) {
		return true;
	}
	if (n <= 0x00ffffff) {
		return true;
	}
	if (n >= 0x0a000000 && n <= 0x0affffff) {
		return true;
	}
	if (n >= 0x7f000000 && n <= 0x7fffffff) {
		return true;
	}
	if (n >= 0xac100000 && n <= 0xac1fffff) {
		return true;
	}
	if (n >= 0xc0a80000 && n <= 0xc0a8ffff) {
		return true;
	}
	if (n >= 0xa9fe0000 && n <= 0xa9feffff) {
		return true;
	}
	if (n >= 0xe0000000) {
		return true;
	}
	return false;
}

function isPrivateIPv6(ip: string) {
	const lower = ip.toLowerCase();
	if (lower === "::1" || lower === "::") {
		return true;
	}
	if (
		lower.startsWith("fe80:") ||
		lower.startsWith("fc") ||
		lower.startsWith("fd")
	) {
		return true;
	}
	if (lower.startsWith("::ffff:")) {
		const mapped = lower.slice("::ffff:".length);
		if (mapped.includes(".")) {
			return isPrivateIPv4(mapped);
		}
	}
	return false;
}

function isPublicHostname(hostname: string) {
	const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
	if (BLOCKED_HOST_RE.test(host)) {
		return false;
	}
	if (host === "0.0.0.0" || host === "::" || host === "::1") {
		return false;
	}
	if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
		return !isPrivateIPv4(host);
	}
	if (host.includes(":")) {
		return !isPrivateIPv6(host);
	}
	return true;
}

export function normalizeJobPostingUrl(input: string) {
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
		if (!isPublicHostname(url.hostname)) {
			return null;
		}
		return url;
	} catch {
		return null;
	}
}

export async function assertPublicJobPostingUrl(url: URL) {
	if (!isPublicHostname(url.hostname)) {
		throw new Error("URL is not allowed");
	}

	if (
		/^\d{1,3}(\.\d{1,3}){3}$/.test(url.hostname) ||
		url.hostname.includes(":")
	) {
		return;
	}

	const { address } = await lookup(url.hostname);
	if (
		address.includes(":") ? isPrivateIPv6(address) : isPrivateIPv4(address)
	) {
		throw new Error("URL is not allowed");
	}
}

function asUnknownArray(value: unknown): unknown[] {
	if (value == null) {
		return [];
	}
	return Array.isArray(value) ? value : [value];
}

function isJobPostingNode(node: unknown): node is Record<string, unknown> {
	if (!node || typeof node !== "object") {
		return false;
	}
	const type = (node as { "@type"?: unknown })["@type"];
	return asUnknownArray(type).some(
		(item) => String(item).toLowerCase() === "jobposting",
	);
}

function findJobPosting(data: unknown): Record<string, unknown> | null {
	if (data == null) {
		return null;
	}
	if (Array.isArray(data)) {
		for (const item of data) {
			const found = findJobPosting(item);
			if (found) {
				return found;
			}
		}
		return null;
	}
	if (typeof data !== "object") {
		return null;
	}
	const obj = data as Record<string, unknown>;
	if (isJobPostingNode(obj)) {
		return obj;
	}
	if (obj["@graph"]) {
		return findJobPosting(obj["@graph"]);
	}
	return null;
}

function stringField(value: unknown): string {
	if (typeof value === "string") {
		return cleanText(value);
	}
	if (value && typeof value === "object" && "name" in value) {
		return stringField((value as { name: unknown }).name);
	}
	return "";
}

function locationFromJobPosting(job: Record<string, unknown>) {
	const parts: string[] = [];
	for (const item of asUnknownArray(job.jobLocation)) {
		if (typeof item === "string") {
			const text = cleanText(item);
			if (text) {
				parts.push(text);
			}
			continue;
		}
		if (!item || typeof item !== "object") {
			continue;
		}
		const address = (item as { address?: unknown }).address;
		if (typeof address === "string") {
			const text = cleanText(address);
			if (text) {
				parts.push(text);
			}
			continue;
		}
		if (address && typeof address === "object") {
			const addr = address as Record<string, unknown>;
			const chunk = [
				addr.addressLocality,
				addr.addressRegion,
				addr.addressCountry,
			]
				.filter((value): value is string => typeof value === "string")
				.map((value) => cleanText(value))
				.filter(Boolean)
				.join(", ");
			if (chunk) {
				parts.push(chunk);
			}
		}
	}
	if (parts.length > 0) {
		return [...new Set(parts)].join(" · ");
	}
	if (String(job.jobLocationType ?? "").toUpperCase() === "TELECOMMUTE") {
		return "Remote";
	}
	return "";
}

function parseJsonLdJobPosting($: cheerio.CheerioAPI) {
	const scripts = $('script[type="application/ld+json"]').toArray();
	for (const script of scripts) {
		const raw = $(script).contents().text().trim();
		if (!raw) {
			continue;
		}
		try {
			const job = findJobPosting(JSON.parse(raw));
			if (!job) {
				continue;
			}
			const descriptionHtml =
				typeof job.description === "string" ? job.description : "";
			return {
				title: stringField(job.title),
				company: stringField(job.hiringOrganization),
				location: locationFromJobPosting(job),
				description: descriptionHtml.includes("<")
					? htmlToReadableText(descriptionHtml)
					: cleanText(descriptionHtml),
			};
		} catch {
			continue;
		}
	}
	return null;
}

function firstText(
	$: cheerio.CheerioAPI,
	selectors: string[],
) {
	for (const selector of selectors) {
		const text = cleanText($(selector).first().text());
		if (text) {
			return text;
		}
	}
	return "";
}

function firstHtmlText(
	$: cheerio.CheerioAPI,
	selectors: string[],
) {
	for (const selector of selectors) {
		const node = $(selector).first();
		if (node.length === 0) {
			continue;
		}
		const html = node.html();
		const text = html ? htmlToReadableText(html) : cleanText(node.text());
		if (text) {
			return text;
		}
	}
	return "";
}

function looksLikeJobDescription(text: string) {
	if (text.length >= 400) {
		return true;
	}
	return text.length >= MIN_DESCRIPTION_LENGTH && JD_HINT_RE.test(text);
}

function isLoginWallHtml(html: string, title: string) {
	const lower = html.toLowerCase();
	const titleLower = title.toLowerCase();
	if (
		/\b(sign in|log in|login|log on|authenticate)\b/.test(titleLower) &&
		html.length < 20_000
	) {
		return true;
	}
	if (
		lower.includes("authwall") ||
		lower.includes("please enable cookies") ||
		lower.includes("unusual traffic")
	) {
		return true;
	}
	return false;
}

export function parseJobPostingHtml(
	html: string,
	pageUrl: string,
): JobPostingDetails | null {
	if (!html || html.length < 200) {
		return null;
	}

	const $ = cheerio.load(html);
	const jsonLd = parseJsonLdJobPosting($);
	$("script, style, noscript").remove();
	const ogTitle = cleanText(
		$('meta[property="og:title"]').attr("content") ||
			$('meta[name="twitter:title"]').attr("content"),
	);
	const docTitle = cleanText($("title").first().text());
	const ogSite = cleanText(
		$('meta[property="og:site_name"]').attr("content"),
	);

	if (isLoginWallHtml(html, ogTitle || docTitle)) {
		return null;
	}

	const title =
		jsonLd?.title ||
		firstText($, [
			'[data-automation-id="jobPostingHeader"]',
			".app-title",
			".posting-headline h2",
			"h1",
		]) ||
		ogTitle ||
		docTitle;

	const company =
		jsonLd?.company ||
		firstText($, [
			'[data-automation-id="jobPostingCompany"]',
			".company-name",
			".posting-headline .company",
			'[itemprop="hiringOrganization"]',
		]) ||
		ogSite;

	const location =
		jsonLd?.location ||
		firstText($, [
			'[data-automation-id="locations"]',
			".location",
			".posting-categories .location",
			'[itemprop="jobLocation"]',
		]);

	const description =
		(jsonLd?.description && looksLikeJobDescription(jsonLd.description)
			? jsonLd.description
			: "") ||
		firstHtmlText($, [
			'[data-automation-id="jobPostingDescription"]',
			'[itemprop="description"]',
			"#job-description",
			".job-description",
			"#content",
			".posting-page",
			"article",
			"main",
		]);

	if (!looksLikeJobDescription(description)) {
		return null;
	}

	return {
		url: pageUrl,
		title: title || "Untitled role",
		company: company || "Unknown company",
		location,
		description,
	};
}
