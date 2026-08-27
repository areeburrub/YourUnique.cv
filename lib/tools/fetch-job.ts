import { runs, tasks } from "@trigger.dev/sdk";

import { classifyJobInput, type ClassifiedJobInput } from "@/lib/tools/job-input";
import type { fetchJobPosting } from "@/trigger/fetch-job-posting";
import type { fetchLinkedInJob } from "@/trigger/fetch-linkedin-job";

export type FetchedJob = {
	title?: string;
	company?: string;
	location?: string;
	url?: string;
	description: string;
};

function formatJob(job: FetchedJob) {
	const header = [job.title, job.company].filter(Boolean).join(" at ");
	const bits = [header, job.location, job.url, "", job.description].filter(
		(part) => part != null && part !== "",
	);
	return bits.join("\n").trim();
}

async function fetchLinkedIn(jobId: string): Promise<FetchedJob> {
	const handle = await tasks.trigger<typeof fetchLinkedInJob>(
		"fetch-linkedin-job",
		{ jobId },
	);
	const run = await runs.poll<typeof fetchLinkedInJob>(handle.id, {
		pollIntervalMs: 750,
	});
	if (!run.isSuccess || !run.output) {
		throw new Error(
			"Could not load that LinkedIn job. Paste the job description text instead.",
		);
	}
	const job = run.output;
	return {
		title: job.title,
		company: job.company,
		location: job.location,
		url: job.url,
		description: job.description,
	};
}

async function fetchPosting(url: string): Promise<FetchedJob> {
	const handle = await tasks.trigger<typeof fetchJobPosting>("fetch-job-posting", {
		url,
	});
	const run = await runs.poll<typeof fetchJobPosting>(handle.id, {
		pollIntervalMs: 750,
	});
	if (!run.isSuccess || !run.output?.ok || !run.output.description) {
		throw new Error(
			"Could not load that job link. Paste the job description text instead.",
		);
	}
	return {
		title: run.output.title,
		company: run.output.company,
		location: run.output.location,
		url: run.output.url,
		description: run.output.description,
	};
}

export function jobFetchStatus(input: ClassifiedJobInput) {
	if (input.kind === "linkedin") {
		return {
			id: "fetch_linkedin_job",
			label: "Fetching the LinkedIn posting",
		};
	}
	if (input.kind === "job_url") {
		return {
			id: "fetch_job_posting",
			label: "Fetching the job posting",
		};
	}
	return null;
}

export async function resolveJobText(raw: string): Promise<string> {
	const classified = classifyJobInput(raw);
	if (classified.kind === "text") {
		return classified.text;
	}
	const job =
		classified.kind === "linkedin"
			? await fetchLinkedIn(classified.jobId)
			: await fetchPosting(classified.url);
	const formatted = formatJob(job);
	if (formatted.length < 40) {
		throw new Error(
			"That posting did not include enough text. Paste the job description instead.",
		);
	}
	return formatted;
}
