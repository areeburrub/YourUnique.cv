export const RADAR_TRACKER_STATUSES = [
	"new",
	"saved",
	"applied",
	"interviewing",
	"offer",
	"rejected",
] as const;

export type RadarTrackerStatus = (typeof RADAR_TRACKER_STATUSES)[number];

export function isRadarTrackerStatus(
	value: string,
): value is RadarTrackerStatus {
	return (RADAR_TRACKER_STATUSES as readonly string[]).includes(value);
}
