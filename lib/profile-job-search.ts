import type { RadarPreferencesRow } from "@/lib/db/radar-preferences";

export const JOB_SEARCH_HEADING = "## Job search";

const SECTION_RE =
	/(?:^|\n)(##\s*job search\s*\n)([\s\S]*?)(?=\n##\s+|$)/i;

const MANAGED_BULLET_RE =
	/^- (Based in:|Open to relocating|Not open to relocation|Workplace:|Avoid:)/i;

const LOOKING_FOR_RE = /^- Looking for:/i;

export function stripJobSearchSection(profile: string) {
	return profile.replace(SECTION_RE, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function getJobSearchSectionBody(profile: string) {
	const match = profile.match(SECTION_RE);
	return match?.[2]?.trim() ?? "";
}

export function upsertJobSearchSection(profile: string, body: string) {
	const trimmedBody = body.trim();
	if (!trimmedBody) {
		return stripJobSearchSection(profile);
	}
	const stripped = stripJobSearchSection(profile);
	const section = `${JOB_SEARCH_HEADING}\n\n${trimmedBody}`;
	if (!stripped) {
		return `${section}\n`;
	}
	return `${stripped}\n\n${section}\n`;
}

export function jobSearchBodyFromPreferences(
	prefs: RadarPreferencesRow | null,
	notes?: string,
) {
	const lines = [
		...lookingForBullets(notes, prefs, ""),
		...managedPreferenceBullets(prefs),
	];
	return lines.join("\n");
}

export function mergeJobSearchIntoProfile(
	profile: string,
	prefs: RadarPreferencesRow | null,
	notes?: string,
) {
	const existing = getJobSearchSectionBody(profile);
	const derived = jobSearchBodyFromPreferences(prefs, notes);
	if (!derived) {
		return profile;
	}
	if (!existing || isDerivedPrefsBlurb(existing)) {
		return upsertJobSearchSection(profile, derived);
	}
	const preserved = stripManagedBullets(existing);
	const tail = [
		...lookingForBullets(notes, prefs, preserved),
		...managedPreferenceBullets(prefs),
	];
	const body = tail.length
		? `${preserved}\n\n${tail.join("\n")}`
		: preserved;
	return upsertJobSearchSection(profile, body);
}

function isDerivedPrefsBlurb(body: string) {
	const lines = body
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);
	if (lines.length === 0) {
		return true;
	}
	return lines.every(
		(line) => MANAGED_BULLET_RE.test(line) || LOOKING_FOR_RE.test(line),
	);
}

function stripManagedBullets(body: string) {
	return body
		.split("\n")
		.filter((line) => !MANAGED_BULLET_RE.test(line.trim()))
		.join("\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

function lookingForBullets(
	notes: string | undefined,
	prefs: RadarPreferencesRow | null,
	existingBody: string,
) {
	const extra = notes?.trim() || prefs?.extraPreferences?.trim();
	if (!extra) {
		return [];
	}
	if (
		/^- Looking for:/im.test(existingBody) ||
		existingBody.toLowerCase().includes(extra.toLowerCase())
	) {
		return [];
	}
	return [`- Looking for: ${extra}`];
}

function managedPreferenceBullets(prefs: RadarPreferencesRow | null) {
	const lines: string[] = [];
	if (prefs?.currentLocation) {
		lines.push(`- Based in: ${prefs.currentLocation}`);
	}
	if (prefs?.openToRelocation) {
		lines.push("- Open to relocating for the right role");
	} else if (prefs?.currentLocation) {
		lines.push("- Not open to relocation");
	}
	if (prefs?.workplaceTypes.length) {
		lines.push(`- Workplace: ${prefs.workplaceTypes.join(", ")}`);
	}
	if (prefs?.negativePreferences.length) {
		lines.push(`- Avoid: ${prefs.negativePreferences.join("; ")}`);
	}
	return lines;
}
