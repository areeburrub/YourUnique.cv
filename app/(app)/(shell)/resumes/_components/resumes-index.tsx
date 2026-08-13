"use client";

import {
	Download,
	ExternalLink,
	FileText,
	LoaderCircle,
	MessageSquare,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useSoftNav } from "@/components/app/soft-nav";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	groupResumesByDate,
	isResumeCompiling,
	resumeDownloadPath,
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

type ResumesIndexProps = {
	initialResumes: ResumeListItem[];
};

export function ResumesIndex({ initialResumes }: ResumesIndexProps) {
	const { openNewChat } = useSoftNav();
	const [resumes, setResumes] = useState(initialResumes);
	const [preview, setPreview] = useState<ResumeListItem | null>(null);

	const groups = useMemo(() => groupResumesByDate(resumes), [resumes]);

	const refresh = useCallback(async () => {
		const res = await fetch("/api/resumes");
		if (!res.ok) {
			return;
		}
		const data = (await res.json()) as { resumes: ResumeListItem[] };
		setResumes(data.resumes);
	}, []);

	useEffect(() => {
		setResumes(initialResumes);
	}, [initialResumes]);

	const hasInFlight = resumes.some((resume) =>
		isResumeCompiling(resume.compileStatus),
	);

	useEffect(() => {
		if (!hasInFlight) {
			return;
		}
		const id = window.setInterval(() => {
			void refresh();
		}, 3000);
		return () => window.clearInterval(id);
	}, [hasInFlight, refresh]);

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<div className="shrink-0 border-b border-border px-4 py-5 sm:px-6">
				<div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<h1 className="font-display text-[24px] font-medium tracking-[-0.48px] text-foreground">
								Resumes
							</h1>
							<p className="mt-1 text-sm text-muted-foreground">
								Tailored PDFs from chat, grouped by the day you created them.
							</p>
						</div>
						<Button
							type="button"
							size="sm"
							className="shrink-0"
							onClick={openNewChat}
						>
							<MessageSquare data-icon="inline-start" />
							New chat
						</Button>
					</div>
				</div>
			</div>

			<div className="min-h-0 flex-1 overflow-auto">
				<div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
					{resumes.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-3 px-4 py-20 text-center">
							<div className="flex size-12 items-center justify-center rounded-media border border-border bg-surface-subtle text-brand">
								<FileText className="size-5" />
							</div>
							<div className="space-y-1">
								<h2 className="font-medium text-sm">No resumes yet</h2>
								<p className="max-w-sm text-sm text-muted-foreground">
									Start a chat and paste a job description to generate your
									first PDF resume.
								</p>
							</div>
							<Button
								type="button"
								size="sm"
								className="mt-1"
								onClick={openNewChat}
							>
								<MessageSquare data-icon="inline-start" />
								New chat
							</Button>
						</div>
					) : (
						<div className="space-y-10">
							{groups.map((group) => (
								<section key={group.key} className="space-y-4">
									<div className="flex items-baseline justify-between gap-3">
										<h2 className="text-base font-semibold tracking-[-0.2px]">
											{group.label}
										</h2>
										<span className="text-xs text-muted-foreground">
											{group.resumes.length}{" "}
											{group.resumes.length === 1 ? "resume" : "resumes"}
										</span>
									</div>
									<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
										{group.resumes.map((resume) => (
											<ResumeCard
												key={resume.id}
												resume={resume}
												onPreview={() => setPreview(resume)}
											/>
										))}
									</div>
								</section>
							))}
						</div>
					)}
					{hasInFlight ? (
						<p className="px-2 py-6 text-center text-[12px] text-muted-soft">
							Refreshing while PDFs compile…
						</p>
					) : null}
				</div>
			</div>

			<Dialog
				open={Boolean(preview)}
				onOpenChange={(open) => {
					if (!open) {
						setPreview(null);
					}
				}}
			>
				<DialogContent
					className="flex max-h-[min(92vh,56rem)] w-[min(960px,calc(100%-2rem))] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none"
					showCloseButton
				>
					{preview ? (
						<>
							<DialogHeader className="border-b border-border px-4 py-3">
								<DialogTitle className="truncate pr-8">
									{preview.roleTitle && preview.companyName
										? `${preview.roleTitle} @ ${preview.companyName}`
										: preview.name}
								</DialogTitle>
								<DialogDescription>
									Preview of your compiled PDF resume.
								</DialogDescription>
							</DialogHeader>
							<iframe
								title={`${preview.name} preview`}
								src={`${resumeDownloadPath(preview.id)}#toolbar=0&navpanes=0`}
								className="min-h-0 w-full flex-1 bg-white"
								style={{ height: "min(72vh, 44rem)" }}
							/>
							<DialogFooter className="sm:justify-between">
								<div className="flex flex-wrap gap-2">
									<a
										href={resumeDownloadPath(preview.id)}
										target="_blank"
										rel="noreferrer"
										className={buttonVariants({ variant: "outline" })}
									>
										Open in new tab
									</a>
									{preview.jobLink ? (
										<a
											href={preview.jobLink}
											target="_blank"
											rel="noreferrer"
											className={buttonVariants({ variant: "outline" })}
										>
											<ExternalLink data-icon="inline-start" />
											Job posting
										</a>
									) : null}
								</div>
								<a
									href={resumeDownloadPath(preview.id, { download: true })}
									download
									className={buttonVariants()}
								>
									<Download data-icon="inline-start" />
									Download PDF
								</a>
							</DialogFooter>
						</>
					) : null}
				</DialogContent>
			</Dialog>
		</div>
	);
}

function ResumeCard({
	resume,
	onPreview,
}: {
	resume: ResumeListItem;
	onPreview: () => void;
}) {
	const compiling = isResumeCompiling(resume.compileStatus);
	const canPreview = resume.compileStatus === "ready" && resume.hasPdf;
	const title =
		resume.roleTitle?.trim() ||
		resume.name;
	const subtitle = resume.companyName?.trim() || null;

	return (
		<article className="group flex flex-col">
			<div
				className={cn(
					"relative overflow-hidden rounded-2xl bg-[#e8ebef] p-2.5 transition-shadow sm:p-3",
					canPreview
						? "cursor-pointer hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
						: "",
				)}
				onClick={() => {
					if (canPreview) {
						onPreview();
					}
				}}
				onKeyDown={(event) => {
					if (
						canPreview &&
						(event.key === "Enter" || event.key === " ")
					) {
						event.preventDefault();
						onPreview();
					}
				}}
				role={canPreview ? "button" : undefined}
				tabIndex={canPreview ? 0 : undefined}
			>
				<div className="relative overflow-hidden rounded-lg bg-white shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
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
								<LoaderCircle className="size-6 animate-spin text-muted-foreground" />
							) : (
								<FileText className="size-6 text-muted-foreground" />
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
								<Button
									type="button"
									size="lg"
									className="h-10 w-full cursor-pointer rounded-xl bg-brand text-sm font-semibold text-brand-foreground shadow-[0_8px_24px_rgba(2,91,255,0.35)] hover:bg-brand/90"
									onClick={(event) => {
										event.stopPropagation();
										onPreview();
									}}
								>
									Preview
								</Button>
								<a
									href={resumeDownloadPath(resume.id, { download: true })}
									download
									onClick={(event) => event.stopPropagation()}
									className={cn(
										buttonVariants({ size: "lg", variant: "secondary" }),
										"h-10 w-full cursor-pointer rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-900 shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:bg-zinc-50 hover:text-zinc-900",
									)}
								>
									<Download data-icon="inline-start" />
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
				{resume.jobLink ? (
					<a
						href={resume.jobLink}
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
						onClick={(event) => event.stopPropagation()}
					>
						Job posting
						<ExternalLink className="size-3" />
					</a>
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
