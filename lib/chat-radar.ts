import type { RadarChatJob } from "@/lib/db/radar";

export const RADAR_CHAT_UI_TOOLS = [
	"list_radar_jobs",
	"get_radar_job",
	"get_radar_preferences",
	"update_radar_preferences",
	"shortlist_radar_jobs",
	"open_job_radar",
] as const;

export function isRadarChatTool(name: string) {
	return (RADAR_CHAT_UI_TOOLS as readonly string[]).includes(name);
}

export type RadarChatUi =
	| { kind: "pro" }
	| { kind: "open"; reason: string }
	| { kind: "jobs"; jobs: RadarChatJob[] };

function asChatJob(value: unknown): RadarChatJob | null {
	if (!value || typeof value !== "object") {
		return null;
	}
	const row = value as Record<string, unknown>;
	if (typeof row.id !== "string" || typeof row.title !== "string") {
		return null;
	}
	return {
		id: row.id,
		title: row.title,
		company: typeof row.company === "string" ? row.company : "",
		location: typeof row.location === "string" ? row.location : "",
		workplace: typeof row.workplace === "string" ? row.workplace : "",
		url: typeof row.url === "string" ? row.url : "",
		atsScore: typeof row.atsScore === "number" ? row.atsScore : 0,
		verdict: typeof row.verdict === "string" ? row.verdict : "",
		summary: typeof row.summary === "string" ? row.summary : "",
		trackerStatus:
			row.trackerStatus === "saved" ||
			row.trackerStatus === "applied" ||
			row.trackerStatus === "interviewing" ||
			row.trackerStatus === "offer" ||
			row.trackerStatus === "rejected"
				? row.trackerStatus
				: "new",
		seniorityFit:
			typeof row.seniorityFit === "string" ? row.seniorityFit : "unclear",
		postedAt: typeof row.postedAt === "string" ? row.postedAt : null,
	};
}

export function radarUiFromToolOutput(
	name: string,
	output: unknown,
): RadarChatUi | null {
	if (!isRadarChatTool(name) || !output || typeof output !== "object") {
		return null;
	}
	const record = output as {
		requiresPro?: boolean;
		ui?: string;
		jobs?: unknown[];
		reason?: string;
	};
	if (record.requiresPro || record.ui === "pro") {
		return { kind: "pro" };
	}
	if (record.ui === "jobs") {
		const jobs = (record.jobs ?? [])
			.map(asChatJob)
			.filter((job): job is RadarChatJob => Boolean(job));
		if (jobs.length === 0) {
			return { kind: "open", reason: "Review matches on Job Radar" };
		}
		return { kind: "jobs", jobs };
	}
	if (record.ui === "open-radar") {
		return {
			kind: "open",
			reason:
				typeof record.reason === "string" && record.reason.trim()
					? record.reason.trim()
					: "Review matches on Job Radar",
		};
	}
	return null;
}
