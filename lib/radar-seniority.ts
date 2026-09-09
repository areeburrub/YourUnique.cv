export const RADAR_SENIORITY_FITS = [
	"match",
	"stretch",
	"too_junior",
	"too_senior",
	"unclear",
] as const;

export type RadarSeniorityFit = (typeof RADAR_SENIORITY_FITS)[number];

export function parseRadarSeniorityFit(value: string | null | undefined) {
	const fit = (value ?? "").trim().toLowerCase().replace(/\s+/g, "_");
	if ((RADAR_SENIORITY_FITS as readonly string[]).includes(fit)) {
		return fit as RadarSeniorityFit;
	}
	return "unclear";
}

export const RADAR_SENIORITY_FIT_LABELS: Record<RadarSeniorityFit, string> = {
	match: "Seniority matches",
	stretch: "Stretch role",
	too_junior: "Role is more senior",
	too_senior: "You are overqualified",
	unclear: "",
};
