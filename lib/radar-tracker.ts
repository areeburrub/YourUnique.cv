export const RADAR_TRACKER_STATUSES = [
	"new",
	"saved",
	"applied",
	"interviewing",
	"offer",
	"rejected",
] as const;

export type RadarTrackerStatus = (typeof RADAR_TRACKER_STATUSES)[number];

/** Roles the user has already acted on. Job Radar email skips these. */
export const RADAR_EMAIL_SKIP_STATUSES = [
	"applied",
	"interviewing",
	"offer",
	"rejected",
] as const satisfies readonly RadarTrackerStatus[];

export function isRadarTrackerStatus(
	value: string,
): value is RadarTrackerStatus {
	return (RADAR_TRACKER_STATUSES as readonly string[]).includes(value);
}
