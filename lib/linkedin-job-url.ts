export type LinkedInJobRef = {
	jobId: string;
	canonicalUrl: string;
};

const JOB_ID_RE = /^\d{6,}$/;

function isLinkedInHost(hostname: string) {
	const host = hostname.replace(/^www\./i, "").toLowerCase();
	return host === "linkedin.com" || host.endsWith(".linkedin.com");
}

function extractJobIdFromPath(pathname: string): string | null {
	const match = pathname.match(/\/jobs\/view\/(?:[^/]*-)?(\d{6,})\/?/i);
	return match?.[1] ?? null;
}

export function extractLinkedInJobId(input: string): LinkedInJobRef | null {
	const trimmed = input.trim();
	if (!trimmed) {
		return null;
	}

	if (JOB_ID_RE.test(trimmed)) {
		return {
			jobId: trimmed,
			canonicalUrl: `https://www.linkedin.com/jobs/view/${trimmed}/`,
		};
	}

	const withProtocol = /^https?:\/\//i.test(trimmed)
		? trimmed
		: `https://${trimmed}`;

	try {
		const url = new URL(withProtocol);
		if (!isLinkedInHost(url.hostname)) {
			return null;
		}

		const fromQuery =
			url.searchParams.get("currentJobId") || url.searchParams.get("jobId");
		if (fromQuery && JOB_ID_RE.test(fromQuery)) {
			return {
				jobId: fromQuery,
				canonicalUrl: `https://www.linkedin.com/jobs/view/${fromQuery}/`,
			};
		}

		const fromPath = extractJobIdFromPath(url.pathname);
		if (fromPath) {
			return {
				jobId: fromPath,
				canonicalUrl: `https://www.linkedin.com/jobs/view/${fromPath}/`,
			};
		}

		return null;
	} catch {
		return null;
	}
}

export function isLinkedInJobUrl(input: string) {
	return extractLinkedInJobId(input) !== null;
}
