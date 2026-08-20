"use client";

import {
	ArrowSquareOutIcon,
	CircleNotchIcon,
	ClockCounterClockwiseIcon,
	DownloadSimpleIcon,
	FileTextIcon,
} from "@phosphor-icons/react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
	isResumeCompiling,
	resumeDownloadPath,
	resumeHistoryPath,
	type ResumeListItem,
} from "@/lib/resumes";
import { cn } from "@/lib/utils";

function statusLabel(status: ResumeListItem["compileStatus"]) {
	switch (status) {
		case "ready":
			return "Ready";
		case "queued":
			return "Queued";
		case "compiling":
			return "Compiling";
		case "failed":
			return "Failed";
		default:
			return "Draft";
	}
}

function statusClass(status: ResumeListItem["compileStatus"]) {
	switch (status) {
		case "ready":
			return "text-emerald-700 bg-emerald-500/10 border-emerald-500/20";
		case "queued":
		case "compiling":
			return "text-amber-800 bg-amber-500/10 border-amber-500/20";
		case "failed":
			return "text-red-700 bg-red-500/10 border-red-500/20";
		default:
			return "text-muted-foreground bg-surface-subtle border-border";
	}
}

export function openResumePdf(resume: ResumeListItem) {
	if (resume.compileStatus !== "ready" || !resume.hasPdf) {
		return;
	}
	window.open(resumeDownloadPath(resume.id), "_blank", "noopener,noreferrer");
}

export function ResumeCard({
	resume,
	showHistoryLink = true,
	versionCaption,
}: {
	resume: ResumeListItem;
	showHistoryLink?: boolean;
	versionCaption?: string;
}) {
	const compiling = isResumeCompiling(resume.compileStatus);
	const canPreview = resume.compileStatus === "ready" && resume.hasPdf;
	const title = resume.roleTitle?.trim() || resume.name;
	const subtitle = resume.companyName?.trim() || null;

	return (
		<article className="group flex flex-col">
			<div
				className={cn(
					"relative overflow-hidden rounded-[28px] bg-pastel-blush p-3 transition-shadow sm:p-3.5",
					canPreview
						? "cursor-pointer hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
						: "",
				)}
				onClick={() => {
					openResumePdf(resume);
				}}
				onKeyDown={(event) => {
					if (canPreview && (event.key === "Enter" || event.key === " ")) {
						event.preventDefault();
						openResumePdf(resume);
					}
				}}
				role={canPreview ? "button" : undefined}
				tabIndex={canPreview ? 0 : undefined}
			>
				<div className="relative overflow-hidden rounded-2xl bg-card product-shadow">
					{resume.previewUrl ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={resume.previewUrl}
							alt={`${title} preview`}
							className="aspect-210/297 h-auto w-full object-cover object-top"
						/>
					) : (
						<div className="flex aspect-210/297 flex-col items-center justify-center gap-2 p-6 text-center">
							{compiling ? (
								<CircleNotchIcon
									size={24}
									className="animate-spin text-muted-foreground"
								/>
							) : (
								<FileTextIcon
									size={24}
									weight="duotone"
									className="text-muted-foreground"
								/>
							)}
							<p className="text-xs text-muted-foreground">
								{compiling
									? "Compiling preview…"
									: resume.compileStatus === "failed"
										? "Compile failed"
										: "No preview yet"}
							</p>
						</div>
					)}

					{canPreview ? (
						<div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-100 transition-all max-md:bg-black/35 md:opacity-0 md:group-hover:bg-black/40 md:group-hover:opacity-100">
							<div className="flex w-[min(100%,13.5rem)] flex-col gap-2.5 px-4">
								<a
									href={resumeDownloadPath(resume.id)}
									target="_blank"
									rel="noopener noreferrer"
									onClick={(event) => event.stopPropagation()}
									className={cn(
										buttonVariants({ size: "lg" }),
										"h-11 w-full cursor-pointer rounded-full bg-brand text-sm font-semibold text-brand-foreground brand-shadow hover:bg-brand/90",
									)}
								>
									Preview
								</a>
								<a
									href={resumeDownloadPath(resume.id, { download: true })}
									download
									onClick={(event) => event.stopPropagation()}
									className={cn(
										buttonVariants({ size: "lg", variant: "secondary" }),
										"h-10 w-full cursor-pointer rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-900 shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:bg-zinc-50 hover:text-zinc-900",
									)}
								>
									<DownloadSimpleIcon data-icon="inline-start" weight="bold" />
									Download
								</a>
							</div>
						</div>
					) : null}
				</div>
			</div>

			<div className="mt-3 space-y-1.5 px-0.5">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0">
						<p className="truncate text-[15px] font-semibold tracking-[-0.2px]">
							{title}
						</p>
						{subtitle ? (
							<p className="truncate text-sm text-muted-foreground">
								{subtitle}
							</p>
						) : null}
					</div>
					<span
						className={cn(
							"shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
							statusClass(resume.compileStatus),
						)}
					>
						{statusLabel(resume.compileStatus)}
					</span>
				</div>
				{versionCaption ? (
					<p className="text-xs text-muted-foreground">{versionCaption}</p>
				) : null}
				{resume.jobLink ? (
					<a
						href={resume.jobLink}
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
						onClick={(event) => event.stopPropagation()}
					>
						Job posting
						<ArrowSquareOutIcon size={12} weight="bold" />
					</a>
				) : null}
				{showHistoryLink && resume.versionCount > 1 ? (
					<Link
						href={resumeHistoryPath(resume.id)}
						className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
						onClick={(event) => event.stopPropagation()}
					>
						<ClockCounterClockwiseIcon size={12} weight="bold" />
						Version history
						{resume.versionCount > 1 ? ` (${resume.versionCount})` : null}
					</Link>
				) : null}
				{resume.compileStatus === "failed" && resume.compileError ? (
					<p className="line-clamp-2 text-xs text-red-700">
						{resume.compileError}
					</p>
				) : null}
			</div>
		</article>
	);
}
