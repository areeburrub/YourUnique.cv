import { FREE_LIST_LIMIT, type RadarListJob } from "@/lib/db/radar";
import { RADAR_EMAIL_SKIP_STATUSES } from "@/lib/radar-tracker";

/** Resend template variables cap at 2,000 characters per value. */
export const RESEND_TEMPLATE_VALUE_MAX = 2000;

const emailedSkipStatuses = new Set<string>(RADAR_EMAIL_SKIP_STATUSES);

export function jobsForRadarReadyEmail(jobs: RadarListJob[]) {
	return jobs
		.filter(
			(job) =>
				!job.blurred &&
				!job.emailedAt &&
				!emailedSkipStatuses.has(job.trackerStatus),
		)
		.slice(0, FREE_LIST_LIMIT);
}

export function buildRadarJobsHtml(jobs: RadarListJob[]) {
	const header = `<p style="margin:8px 0 12px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#6B635B;">Top matches</p>`;
	const lines: string[] = [];
	const included: RadarListJob[] = [];

	for (const job of jobs) {
		const line = radarJobEmailLine(job);
		const next = header + lines.join("") + line;
		if (next.length > RESEND_TEMPLATE_VALUE_MAX) {
			break;
		}
		lines.push(line);
		included.push(job);
	}

	if (lines.length === 0) {
		return { html: "", jobs: included };
	}

	return { html: header + lines.join(""), jobs: included };
}

function radarJobEmailLine(job: RadarListJob) {
	const title = escapeHtml(job.title?.trim() || "Matching role");
	const score = Number.isFinite(job.atsScore)
		? ` (${Math.round(job.atsScore)})`
		: "";
	const meta = [job.company, job.location, job.workplace]
		.filter(Boolean)
		.map((value) => escapeHtml(String(value)))
		.join(" · ");
	const titleHtml = job.url
		? `<a href="${escapeHtml(job.url)}" style="color:#1C1816;text-decoration:none;font-weight:600;">${title}</a>`
		: `<span style="font-weight:600;">${title}</span>`;

	return `<p style="margin:0 0 10px;font-size:15px;line-height:22px;color:#1C1816;">${titleHtml}${escapeHtml(score)}${meta ? `<br><span style="font-size:13px;color:#6B635B;">${meta}</span>` : ""}</p>`;
}

function escapeHtml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}
