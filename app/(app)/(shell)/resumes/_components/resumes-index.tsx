"use client";

import { Download, FileText, LoaderCircle, MessageSquare } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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
	isResumeCompiling,
	resumeDownloadPath,
	type ResumeListItem,
} from "@/lib/resumes";
import { cn } from "@/lib/utils";

function formatUpdatedAt(iso: string) {
	const date = new Date(iso);
	const now = new Date();
	const startOfToday = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
	);
	const startOfThatDay = new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
	);
	const dayDiff = Math.round(
		(startOfToday.getTime() - startOfThatDay.getTime()) / 86_400_000,
	);

	if (dayDiff === 0) {
		return date.toLocaleTimeString(undefined, {
			hour: "numeric",
			minute: "2-digit",
		});
	}
	if (dayDiff === 1) {
		return "Yesterday";
	}
	if (dayDiff < 7) {
		return date.toLocaleDateString(undefined, { weekday: "short" });
	}
	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});
}

function UpdatedAt({ iso }: { iso: string }) {
	const [label, setLabel] = useState<string | null>(null);

	useEffect(() => {
		setLabel(formatUpdatedAt(iso));
	}, [iso]);

	return (
		<span className="shrink-0 text-[12px] text-muted-soft" suppressHydrationWarning>
			{label ?? "\u00a0"}
		</span>
	);
}

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
				<div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<h1 className="font-display text-[24px] font-medium tracking-[-0.48px] text-foreground">
								Resumes
							</h1>
							<p className="mt-1 text-sm text-muted-foreground">
								PDF resumes drafted in chat. Click a ready resume to preview.
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
				<div className="mx-auto w-full max-w-3xl px-4 py-2 sm:px-6">
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
						<ul className="divide-y divide-border">
							{resumes.map((resume) => {
								const compiling = isResumeCompiling(resume.compileStatus);
								const canPreview =
									resume.compileStatus === "ready" && resume.hasPdf;

								return (
									<li key={resume.id}>
										<div
											className={cn(
												"flex items-start gap-3 py-4",
												"-mx-2 rounded-control px-2 sm:-mx-3 sm:px-3",
												canPreview &&
													"cursor-pointer transition-colors hover:bg-surface-subtle/80",
											)}
											onClick={() => {
												if (canPreview) {
													setPreview(resume);
												}
											}}
											onKeyDown={(event) => {
												if (
													canPreview &&
													(event.key === "Enter" || event.key === " ")
												) {
													event.preventDefault();
													setPreview(resume);
												}
											}}
											role={canPreview ? "button" : undefined}
											tabIndex={canPreview ? 0 : undefined}
										>
											<div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-media border border-border bg-background text-muted-foreground">
												{compiling ? (
													<LoaderCircle className="size-4 animate-spin" />
												) : (
													<FileText className="size-4" />
												)}
											</div>
											<div className="min-w-0 flex-1">
												<div className="flex items-baseline justify-between gap-3">
													<h2 className="truncate text-sm font-medium text-foreground">
														{resume.name}
													</h2>
													<UpdatedAt iso={resume.updatedAt} />
												</div>
												<div className="mt-1.5 flex flex-wrap items-center gap-2">
													<span
														className={cn(
															"inline-flex items-center rounded-control border px-1.5 py-0.5 text-[11px] font-medium",
															statusClass(resume.compileStatus),
														)}
													>
														{statusLabel(resume.compileStatus)}
													</span>
													{canPreview ? (
														<span className="text-[12px] text-muted-soft">
															Click to preview
														</span>
													) : null}
													{resume.compileStatus === "failed" &&
													resume.compileError ? (
														<p className="line-clamp-2 text-[12px] text-red-700">
															{resume.compileError}
														</p>
													) : null}
												</div>
											</div>
											{canPreview ? (
												<a
													href={resumeDownloadPath(resume.id, {
														download: true,
													})}
													download
													onClick={(event) => event.stopPropagation()}
													className={cn(
														buttonVariants({
															variant: "outline",
															size: "sm",
														}),
														"shrink-0",
													)}
												>
													<Download data-icon="inline-start" />
													Download
												</a>
											) : null}
										</div>
									</li>
								);
							})}
						</ul>
					)}
					{hasInFlight ? (
						<p className="px-2 py-4 text-center text-[12px] text-muted-soft">
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
									{preview.name}
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
								<a
									href={resumeDownloadPath(preview.id)}
									target="_blank"
									rel="noreferrer"
									className={buttonVariants({ variant: "outline" })}
								>
									Open in new tab
								</a>
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
