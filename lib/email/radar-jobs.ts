import { FREE_LIST_LIMIT, type RadarListJob } from "@/lib/db/radar";

export function jobsForRadarReadyEmail(jobs: RadarListJob[]) {
	return jobs.filter((job) => !job.blurred).slice(0, FREE_LIST_LIMIT);
}

export function buildRadarJobsHtml(jobs: RadarListJob[]) {
	if (jobs.length === 0) {
		return "";
	}

	const rows = jobs
		.map((job) => {
			const title = escapeHtml(job.title?.trim() || "Matching role");
			const score = Number.isFinite(job.atsScore)
				? String(Math.round(job.atsScore))
				: "";
			const meta = [job.company, job.location, job.workplace]
				.filter(Boolean)
				.map((value) => escapeHtml(String(value)))
				.join(" · ");
			const titleHtml = job.url
				? `<a href="${escapeHtml(job.url)}" style="color:#1C1816;text-decoration:none;font-weight:600;">${title}</a>`
				: `<span style="font-weight:600;">${title}</span>`;

			return `<tr>
      <td style="padding:12px 0;border-bottom:1px solid #E4D9CE;vertical-align:top;">
        <p style="margin:0 0 4px;font-size:16px;line-height:22px;color:#1C1816;">${titleHtml}</p>
        ${meta ? `<p style="margin:0;font-size:13px;line-height:20px;color:#6B635B;">${meta}</p>` : ""}
      </td>
      <td style="padding:12px 0 12px 16px;border-bottom:1px solid #E4D9CE;text-align:right;vertical-align:top;white-space:nowrap;font-size:13px;line-height:22px;color:#6B635B;">${escapeHtml(score)}</td>
    </tr>`;
		})
		.join("");

	return `<p style="margin:8px 0 4px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#6B635B;">Top matches</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">${rows}</table>`;
}

function escapeHtml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}
