import "server-only";

import { ApifyClient } from "apify-client";

import { normalizeLinkedInProfileUrl } from "@/lib/linkedin-profile";

const LINKEDIN_PROFILE_ACTOR = "harvestapi/linkedin-profile-scraper";
const PROFILE_SCRAPER_MODE = "Profile details no email ($4 per 1k)";
const ACTOR_WAIT_SECS = 240;

export type LinkedInProfileData = {
	name?: string;
	headline?: string;
	location?: string;
	about?: string;
	experience?: unknown;
	education?: unknown;
	skills?: unknown;
	projects?: unknown;
	publications?: unknown;
	recommendations?: unknown;
	certifications?: unknown;
	languages?: unknown;
	honorsAndAwards?: unknown;
};

function locationText(location: unknown): string | undefined {
	if (typeof location === "string" && location.trim()) {
		return location;
	}
	if (!location || typeof location !== "object") {
		return undefined;
	}
	const record = location as Record<string, unknown>;
	if (typeof record.linkedinText === "string" && record.linkedinText.trim()) {
		return record.linkedinText;
	}
	const parsed = record.parsed;
	if (parsed && typeof parsed === "object") {
		const text = (parsed as { text?: unknown }).text;
		if (typeof text === "string" && text.trim()) {
			return text;
		}
	}
	return undefined;
}

function profileName(item: Record<string, unknown>): string | undefined {
	const first = typeof item.firstName === "string" ? item.firstName.trim() : "";
	const last = typeof item.lastName === "string" ? item.lastName.trim() : "";
	const name = [first, last].filter(Boolean).join(" ");
	return name || undefined;
}

function pickProfile(item: Record<string, unknown>): LinkedInProfileData | null {
	const status = item.status;
	if (typeof status === "number" && status !== 200) {
		return null;
	}

	const profile: LinkedInProfileData = {
		name: profileName(item),
		headline: typeof item.headline === "string" ? item.headline : undefined,
		location: locationText(item.location),
		about: typeof item.about === "string" ? item.about : undefined,
		experience: item.experience,
		education: item.education,
		skills: item.skills,
		projects: item.projects,
		publications: item.publications,
		recommendations:
			item.receivedRecommendations ?? item.recommendations,
		certifications: item.certifications,
		languages: item.languages,
		honorsAndAwards: item.honorsAndAwards,
	};

	if (
		!profile.name &&
		!profile.about &&
		!profile.headline &&
		profile.experience == null
	) {
		return null;
	}

	return profile;
}

export async function fetchLinkedInProfile(
	linkedinUrl: string,
): Promise<LinkedInProfileData | null> {
	const token = process.env.APIFY_TOKEN?.trim();
	const normalized = normalizeLinkedInProfileUrl(linkedinUrl);
	if (!token || !normalized) {
		return null;
	}

	try {
		const client = new ApifyClient({ token });
		const run = await client.actor(LINKEDIN_PROFILE_ACTOR).call(
			{
				profileScraperMode: PROFILE_SCRAPER_MODE,
				queries: [normalized],
			},
			{ waitSecs: ACTOR_WAIT_SECS, log: null },
		);

		if (run.status !== "SUCCEEDED" || !run.defaultDatasetId) {
			return null;
		}

		const { items } = await client.dataset(run.defaultDatasetId).listItems();
		const first = items[0];
		if (!first || typeof first !== "object") {
			return null;
		}

		return pickProfile(first as Record<string, unknown>);
	} catch {
		return null;
	}
}
