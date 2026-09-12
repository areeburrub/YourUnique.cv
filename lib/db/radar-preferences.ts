import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
	type RadarWorkplaceType,
	radarPreferences,
} from "@/lib/db/schema";

export const MAX_NEGATIVE_NOTES = 8;

export type RadarPreferencesInput = {
	currentLocation: string;
	openToRelocation: boolean;
	preferredLocations: string[];
	relocationRadiusKm: number | null;
	workplaceTypes: RadarWorkplaceType[];
	extraPreferences: string;
};

export type RadarPreferencesRow = RadarPreferencesInput & {
	negativePreferences: string[];
	promptText: string;
};

function clip(text: string, max: number) {
	const trimmed = text.trim();
	return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

/**
 * Renders the saved settings (+ accumulated negative feedback) into a single
 * markdown-ish doc, the same shape as the career profile. This is what
 * actually reaches the Go matcher's filter LLM call, so it must read as
 * plain instructions, not as raw form data.
 */
export function buildPreferencesPrompt(
	input: RadarPreferencesInput,
	negativePreferences: string[],
): string {
	const lines: string[] = ["## Job search preferences"];

	if (input.currentLocation) {
		lines.push(`- Candidate is currently based in: ${input.currentLocation}.`);
	}

	if (input.openToRelocation) {
		lines.push(
			"- Open to relocating for the right role. Do not exclude onsite/hybrid roles purely by distance from the current location — rank them by how reasonable the move looks (major hub, similar cost of living/region, visa feasibility) rather than requiring a named target city.",
		);
		lines.push(
			"- Remote still has to hire in the candidate's current country unless the posting is explicitly worldwide. US-only / UK-only remote is not a match just because they might relocate for an office role.",
		);
	} else {
		lines.push(
			"- NOT open to relocation. Onsite and hybrid must be in or very near the current location above.",
		);
		lines.push(
			"- Remote is allowed ONLY when the posting hires in the candidate's country or is explicitly worldwide / remote-from-that-country. US-only, UK-only, EU-only, Canada-only, or \"must live in another country\" remote is NOT a match — even if the skills fit perfectly.",
		);
		lines.push(
			"- Prioritize roles in the current city and country over remote. A skills match is not enough if they would not hire this person from where they live.",
		);
	}

	if (input.workplaceTypes.length > 0) {
		lines.push(
			`- Only consider workplace types: ${input.workplaceTypes.join(", ")}.`,
		);
	}

	if (input.extraPreferences) {
		lines.push(`- Additional preferences: ${clip(input.extraPreferences, 2000)}`);
	}

	if (negativePreferences.length > 0) {
		lines.push(
			"- Avoid roles like these (candidate previously marked them irrelevant):",
		);
		for (const note of negativePreferences) {
			lines.push(`  - ${note}`);
		}
	}

	return lines.join("\n");
}

export async function getRadarPreferences(
	userId: string,
): Promise<RadarPreferencesRow | null> {
	const row = await db.query.radarPreferences.findFirst({
		where: eq(radarPreferences.userId, userId),
	});
	if (!row) {
		return null;
	}
	return {
		currentLocation: row.currentLocation,
		openToRelocation: row.openToRelocation,
		preferredLocations: row.preferredLocations,
		relocationRadiusKm: row.relocationRadiusKm,
		workplaceTypes: row.workplaceTypes,
		extraPreferences: row.extraPreferences,
		negativePreferences: row.negativePreferences,
		promptText: buildPreferencesPrompt(
			{
				currentLocation: row.currentLocation,
				openToRelocation: row.openToRelocation,
				preferredLocations: row.preferredLocations,
				relocationRadiusKm: row.relocationRadiusKm,
				workplaceTypes: row.workplaceTypes,
				extraPreferences: row.extraPreferences,
			},
			row.negativePreferences,
		),
	};
}

export async function saveRadarPreferences(
	userId: string,
	input: RadarPreferencesInput,
) {
	const existing = await db.query.radarPreferences.findFirst({
		where: eq(radarPreferences.userId, userId),
		columns: { negativePreferences: true },
	});
	const negativePreferences = existing?.negativePreferences ?? [];
	const promptText = buildPreferencesPrompt(input, negativePreferences);

	await db
		.insert(radarPreferences)
		.values({
			userId,
			currentLocation: input.currentLocation,
			openToRelocation: input.openToRelocation,
			preferredLocations: input.preferredLocations,
			relocationRadiusKm: input.relocationRadiusKm,
			workplaceTypes: input.workplaceTypes,
			extraPreferences: input.extraPreferences,
			negativePreferences,
			promptText,
			updatedAt: new Date(),
		})
		.onConflictDoUpdate({
			target: radarPreferences.userId,
			set: {
				currentLocation: input.currentLocation,
				openToRelocation: input.openToRelocation,
				preferredLocations: input.preferredLocations,
				relocationRadiusKm: input.relocationRadiusKm,
				workplaceTypes: input.workplaceTypes,
				extraPreferences: input.extraPreferences,
				promptText,
				updatedAt: new Date(),
			},
		});

	return promptText;
}

export async function patchRadarPreferences(
	userId: string,
	patch: Partial<RadarPreferencesInput> & { avoidNotes?: string[] },
) {
	const existing = await getRadarPreferences(userId);
	const input: RadarPreferencesInput = {
		currentLocation:
			patch.currentLocation ?? existing?.currentLocation ?? "",
		openToRelocation:
			patch.openToRelocation ?? existing?.openToRelocation ?? false,
		preferredLocations:
			patch.preferredLocations ?? existing?.preferredLocations ?? [],
		relocationRadiusKm:
			patch.relocationRadiusKm === undefined
				? (existing?.relocationRadiusKm ?? null)
				: patch.relocationRadiusKm,
		workplaceTypes: patch.workplaceTypes ?? existing?.workplaceTypes ?? [],
		extraPreferences:
			patch.extraPreferences ?? existing?.extraPreferences ?? "",
	};
	await saveRadarPreferences(userId, input);
	if (patch.avoidNotes && patch.avoidNotes.length > 0) {
		await applyDismissedJobFeedback(userId, { avoidNotes: patch.avoidNotes });
	}
	return getRadarPreferences(userId);
}

function mergeAvoidNotes(existing: string[], incoming: string[]) {
	const seen = new Set(existing.map((note) => note.toLowerCase()));
	const merged = [...existing];
	for (const raw of incoming) {
		const note = clip(raw, 160);
		if (!note) continue;
		const key = note.toLowerCase();
		if (seen.has(key)) continue;
		merged.push(note);
		seen.add(key);
	}
	return merged.slice(-MAX_NEGATIVE_NOTES);
}

/**
 * Merges extracted avoid-rules into the CURRENT preferences after a
 * thumbs-down. This only ever appends to `negativePreferences` — every other
 * field (including `extraPreferences`, which the user typed themselves) is
 * carried over from the existing row untouched, so a dismiss can never
 * silently rewrite something the candidate wrote.
 */
export async function applyDismissedJobFeedback(
	userId: string,
	feedback: { avoidNotes: string[] },
) {
	const existing = await db.query.radarPreferences.findFirst({
		where: eq(radarPreferences.userId, userId),
	});
	const negativePreferences = mergeAvoidNotes(
		existing?.negativePreferences ?? [],
		feedback.avoidNotes,
	);

	const base: RadarPreferencesInput = existing
		? {
				currentLocation: existing.currentLocation,
				openToRelocation: existing.openToRelocation,
				preferredLocations: existing.preferredLocations,
				relocationRadiusKm: existing.relocationRadiusKm,
				workplaceTypes: existing.workplaceTypes,
				extraPreferences: existing.extraPreferences,
			}
		: {
				currentLocation: "",
				openToRelocation: false,
				preferredLocations: [],
				relocationRadiusKm: null,
				workplaceTypes: [],
				extraPreferences: "",
			};
	const promptText = buildPreferencesPrompt(base, negativePreferences);

	await db
		.insert(radarPreferences)
		.values({
			userId,
			...base,
			negativePreferences,
			promptText,
			updatedAt: new Date(),
		})
		.onConflictDoUpdate({
			target: radarPreferences.userId,
			set: {
				negativePreferences,
				promptText,
				updatedAt: new Date(),
			},
		});

	return { negativePreferences };
}
