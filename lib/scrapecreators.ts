const SCRAPECREATORS_PROFILE_URL =
	"https://api.scrapecreators.com/v1/linkedin/profile";

export type LinkedInProfileData = {
	name?: string;
	location?: string;
	about?: string;
	experience?: unknown;
	education?: unknown;
	projects?: unknown;
	publications?: unknown;
	recommendations?: unknown;
};

export function normalizeLinkedInProfileUrl(input: string) {
	const trimmed = input.trim();
	if (!trimmed) {
		return null;
	}
	const withProtocol = /^https?:\/\//i.test(trimmed)
		? trimmed
		: `https://${trimmed}`;
	try {
		const url = new URL(withProtocol);
		const host = url.hostname.replace(/^www\./i, "").toLowerCase();
		if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) {
			return null;
		}
		if (!url.pathname.includes("/in/")) {
			return null;
		}
		url.hash = "";
		url.search = "";
		return url.toString().replace(/\/$/, "");
	} catch {
		return null;
	}
}

export function isLinkedInProfileUrl(input: string) {
	return normalizeLinkedInProfileUrl(input) !== null;
}

export async function fetchLinkedInProfile(
	linkedinUrl: string,
): Promise<LinkedInProfileData | null> {
	const apiKey = process.env.SCRAPECREATORS_API_KEY?.trim();
	const normalized = normalizeLinkedInProfileUrl(linkedinUrl);
	if (!apiKey || !normalized) {
		return null;
	}

	try {
		const url = new URL(SCRAPECREATORS_PROFILE_URL);
		url.searchParams.set("url", normalized);

		const response = await fetch(url, {
			headers: {
				"x-api-key": apiKey,
			},
			cache: "no-store",
		});

		if (!response.ok) {
			return null;
		}

		const data = (await response.json()) as Record<string, unknown>;
		if (data.success === false) {
			return null;
		}

		return {
			name: typeof data.name === "string" ? data.name : undefined,
			location:
				typeof data.location === "string" ? data.location : undefined,
			about: typeof data.about === "string" ? data.about : undefined,
			experience: data.experience,
			education: data.education,
			projects: data.projects,
			publications: data.publications,
			recommendations: data.recommendations,
		};
	} catch {
		return null;
	}
}
