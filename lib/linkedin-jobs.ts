import * as cheerio from "cheerio";

import {
	extractLinkedInJobId,
	isLinkedInJobUrl,
	type LinkedInJobRef,
} from "@/lib/linkedin-job-url";

export { extractLinkedInJobId, isLinkedInJobUrl };
export type { LinkedInJobRef };

export type LinkedInJobCriteria = {
	seniority?: string;
	employmentType?: string;
	jobFunction?: string;
	industries?: string;
};

export type LinkedInJobDetails = {
	jobId: string;
	url: string;
	title: string;
	company: string;
	location: string;
	description: string;
	criteria: LinkedInJobCriteria;
};

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

	const text = decodeHtmlEntities(root.text())
		.replace(/\r\n/g, "\n")
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.replace(/[ \t]{2,}/g, " ")
		.trim();

	return text;
}

function isAuthwallHtml(html: string) {
	const lower = html.toLowerCase();
	if (html.length < 4000 && lower.includes("authwall")) {
		return true;
	}
	if (lower.includes("/authwall?") && !lower.includes("show-more-less-html__markup")) {
		return true;
	}
	return false;
}

function cleanText(value: string | undefined | null) {
	if (!value) {
		return "";
	}
	return decodeHtmlEntities(value).replace(/\s+/g, " ").trim();
}

export function parseLinkedInJobHtml(
	html: string,
	jobId: string,
): LinkedInJobDetails | null {
	if (!html || isAuthwallHtml(html)) {
		return null;
	}

	const $ = cheerio.load(html);
	const title = cleanText($(".top-card-layout__title").first().text());
	const company = cleanText($(".topcard__org-name-link").first().text());

	const flavors = $(".topcard__flavor")
		.toArray()
		.map((el) => cleanText($(el).text()))
		.filter(Boolean);

	let location = "";
	if (flavors.length >= 2) {
		location = flavors[1] ?? "";
	} else if (flavors.length === 1 && flavors[0] !== company) {
		location = flavors[0] ?? "";
	}

	const descriptionHtml =
		$(".show-more-less-html__markup").first().html() ||
		$(".description__text").first().html() ||
		"";
	const description = htmlToReadableText(descriptionHtml);

	if (!description || description.length < 40) {
		return null;
	}

	const criteria: LinkedInJobCriteria = {};
	$(".description__job-criteria-item").each((_, el) => {
		const label = cleanText(
			$(el).find(".description__job-criteria-subheader").first().text(),
		).toLowerCase();
		const value = cleanText(
			$(el).find(".description__job-criteria-text").first().text(),
		);
		if (!label || !value) {
			return;
		}
		if (label.includes("seniority")) {
			criteria.seniority = value;
		} else if (label.includes("employment")) {
			criteria.employmentType = value;
		} else if (label.includes("function")) {
			criteria.jobFunction = value;
		} else if (label.includes("industr")) {
			criteria.industries = value;
		}
	});

	return {
		jobId,
		url: `https://www.linkedin.com/jobs/view/${jobId}/`,
		title: title || "Untitled role",
		company: company || "Unknown company",
		location,
		description,
		criteria,
	};
}
