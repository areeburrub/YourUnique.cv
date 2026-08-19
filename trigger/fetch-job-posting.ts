import { Impit } from "impit";
import { AbortTaskRunError, logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

import {
	assertPublicJobPostingUrl,
	normalizeJobPostingUrl,
	parseJobPostingHtml,
} from "@/lib/job-postings";

const resultSchema = z.object({
	ok: z.boolean(),
	url: z.string(),
	title: z.string().optional(),
	company: z.string().optional(),
	location: z.string().optional(),
	description: z.string().optional(),
	reason: z.string().optional(),
});

async function fetchPage(url: string) {
	const proxyUrl = process.env.FD_PROXY_URL?.trim() || undefined;
	if (!proxyUrl) {
		logger.warn("FD_PROXY_URL is not set; the host may block the request");
	}

	const impit = new Impit({
		browser: "chrome",
		proxyUrl,
		timeout: 25_000,
		followRedirects: true,
	});

	const response = await impit.fetch(url, {
		headers: {
			"Accept-Language": "en-US,en;q=0.9",
			Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
		},
	});

	const contentType = response.headers.get("content-type") ?? "";
	const html = await response.text();
	logger.info("Fetched job posting page", {
		url,
		status: response.status,
		contentType,
		bytes: html.length,
	});

	return { response, contentType, html };
}

export const fetchJobPosting = schemaTask({
	id: "fetch-job-posting",
	schema: z.object({
		url: z.string().min(1),
	}),
	retry: {
		maxAttempts: 2,
	},
	run: async (payload): Promise<z.infer<typeof resultSchema>> => {
		const parsedUrl = normalizeJobPostingUrl(payload.url);
		if (!parsedUrl) {
			throw new AbortTaskRunError("Not a public http(s) job URL");
		}

		try {
			await assertPublicJobPostingUrl(parsedUrl);
		} catch {
			throw new AbortTaskRunError("URL is not allowed");
		}

		const requestUrl = parsedUrl.toString();
		let fetched: Awaited<ReturnType<typeof fetchPage>>;
		try {
			fetched = await fetchPage(requestUrl);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Network error";
			logger.warn("Job posting fetch failed", { url: requestUrl, message });
			throw error;
		}

		const pageUrl = fetched.response.url || requestUrl;

		if (
			!fetched.response.ok &&
			fetched.response.status >= 400 &&
			fetched.response.status < 500
		) {
			return {
				ok: false,
				url: pageUrl,
				reason: `HTTP ${fetched.response.status}`,
			};
		}

		if (!fetched.response.ok && fetched.response.status !== 999) {
			throw new Error(
				`Host returned HTTP ${fetched.response.status} for ${pageUrl}`,
			);
		}

		if (fetched.contentType.toLowerCase().includes("application/pdf")) {
			return {
				ok: false,
				url: pageUrl,
				reason: "pdf",
			};
		}

		const job = parseJobPostingHtml(fetched.html, pageUrl);
		if (!job) {
			return {
				ok: false,
				url: pageUrl,
				reason: "unreadable",
			};
		}

		return {
			ok: true,
			url: job.url,
			title: job.title,
			company: job.company,
			location: job.location,
			description: job.description,
		};
	},
});
