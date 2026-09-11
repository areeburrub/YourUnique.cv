"use client";

import { BookmarkCheck, ExternalLink, SatelliteDish } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { RadarChatJob } from "@/lib/db/radar";
import { cn } from "@/lib/utils";

function scoreClass(score: number) {
	if (score >= 70) {
		return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
	}
	if (score >= 50) {
		return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
	}
	return "bg-muted text-muted-foreground";
}

function JobRow({ job }: { job: RadarChatJob }) {
	const meta = [job.company, job.location, job.workplace]
		.filter(Boolean)
		.join(" · ");
	const score = Number.isFinite(job.atsScore) ? Math.round(job.atsScore) : null;
	const saved = job.trackerStatus === "saved";

	return (
		<article className="min-w-0 rounded-xl border border-border bg-background p-3">
			<div className="flex min-w-0 items-start gap-2">
				<div className="min-w-0 flex-1">
					<p className="wrap-break-word text-[14px] font-medium leading-snug">
						{job.title}
					</p>
					{meta ? (
						<p className="mt-0.5 truncate text-xs text-muted-foreground">
							{meta}
						</p>
					) : null}
				</div>
				{score != null ? (
					<span
						className={cn(
							"shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums",
							scoreClass(score),
						)}
					>
						{score}
					</span>
				) : null}
			</div>
			<div className="mt-2.5 flex flex-wrap items-center gap-1.5">
				{job.url ? (
					<Button
						variant="outline"
						size="xs"
						nativeButton={false}
						render={<a href={job.url} target="_blank" rel="noreferrer" />}
					>
						<ExternalLink size={13} />
						Posting
					</Button>
				) : null}
				<Button
					variant="outline"
					size="xs"
					nativeButton={false}
					render={<Link href={`/new-chat?radarJobId=${job.id}`} />}
				>
					Generate CV
				</Button>
				{saved ? (
					<span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">
						<BookmarkCheck size={12} />
						Shortlisted
					</span>
				) : null}
			</div>
		</article>
	);
}

export function RadarJobsCard({ jobs }: { jobs: RadarChatJob[] }) {
	if (jobs.length === 0) {
		return null;
	}

	return (
		<div className="w-full max-w-[min(100%,28rem)] overflow-hidden rounded-2xl border border-border bg-card">
			<div className="flex items-center gap-2 border-b border-border px-3.5 py-2.5">
				<SatelliteDish size={16} className="text-brand" />
				<p className="text-sm font-medium">Job Radar</p>
				<span className="text-xs text-muted-foreground">
					{jobs.length} {jobs.length === 1 ? "role" : "roles"}
				</span>
			</div>
			<div className="flex flex-col gap-2 p-2.5">
				{jobs.map((job) => (
					<JobRow key={job.id} job={job} />
				))}
			</div>
			<div className="border-t border-border px-3.5 py-2.5">
				<Button
					variant="ghost"
					size="sm"
					className="h-8 px-2 text-xs"
					nativeButton={false}
					render={<Link href="/job-radar" />}
				>
					Open Job Radar
				</Button>
			</div>
		</div>
	);
}
