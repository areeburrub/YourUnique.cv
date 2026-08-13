import { Impit } from "impit";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

import { parseLinkedInJobHtml } from "@/lib/linkedin-jobs";

const criteriaSchema = z.object({
	seniority: z.string().optional(),
	employmentType: z.string().optional(),
	jobFunction: z.string().optional(),
	industries: z.string().optional(),
});

async function fetchJobHtml(jobId: string, url: string) {
	const proxyUrl = process.env.FD_PROXY_URL?.trim() || undefined;
	if (!proxyUrl) {
		logger.warn("FD_PROXY_URL is not set; LinkedIn may block the request");
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

	const html = await response.text();
	logger.info("Fetched LinkedIn job page", {
		jobId,
		url,
		status: response.status,
		bytes: html.length,
	});

	if (!response.ok && response.status !== 999) {
		throw new Error(`LinkedIn returned HTTP ${response.status} for ${url}`);
	}

	return html;
}

export const fetchLinkedInJob = schemaTask({
	id: "fetch-linkedin-job",
	schema: z.object({
		jobId: z.string().regex(/^\d{6,}$/),
	}),
	retry: {
		maxAttempts: 2,
	},
	run: async (payload) => {
		const { jobId } = payload;
		const viewUrl = `https://www.linkedin.com/jobs/view/${jobId}/`;
		const guestUrl = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`;

		let html = await fetchJobHtml(jobId, viewUrl);
		let parsed = parseLinkedInJobHtml(html, jobId);

		if (!parsed) {
			logger.info("View page parse failed; trying guest endpoint", { jobId });
			html = await fetchJobHtml(jobId, guestUrl);
			parsed = parseLinkedInJobHtml(html, jobId);
		}

		if (!parsed) {
			throw new Error(
				`Could not extract job description for LinkedIn job ${jobId}. The posting may be private, expired, or blocked.`,
			);
		}

		return {
			jobId: parsed.jobId,
			url: parsed.url,
			title: parsed.title,
			company: parsed.company,
			location: parsed.location,
			description: parsed.description,
			criteria: criteriaSchema.parse(parsed.criteria),
		};
	},
});
