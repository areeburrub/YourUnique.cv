"use client";

import { useQuery } from "@tanstack/react-query";
import { CircleNotchIcon, DownloadSimpleIcon } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";

import { MixpanelEvent, trackEvent } from "@/lib/mixpanel";
import {
	isResumeCompiling,
	resumeDownloadPath,
	resumeIdFromDownloadUrl,
	resumeStatusKey,
	type ResumeListItem,
} from "@/lib/resumes";
import { cn } from "@/lib/utils";

type ResumePdfCardProps = {
	name: string;
	previewUrl: string;
	downloadUrl: string;
	compileStatus?: ResumeListItem["compileStatus"];
	className?: string;
};

async function fetchResumeStatus(resumeId: string) {
	const response = await fetch(`/api/resumes/${resumeId}`);
	if (!response.ok) {
		throw new Error("Failed to load resume");
	}
	const data = (await response.json()) as { resume: ResumeListItem };
	return data.resume;
}

export function ResumePdfCard({
	name,
	previewUrl,
	downloadUrl,
	compileStatus,
	className,
}: ResumePdfCardProps) {
	const resumeId = resumeIdFromDownloadUrl(previewUrl);
	const { data } = useQuery({
		queryKey: resumeId ? resumeStatusKey(resumeId) : ["resume-status", "missing"],
		queryFn: () => fetchResumeStatus(resumeId!),
		enabled: Boolean(resumeId),
		initialData: compileStatus
			? ({
					id: resumeId ?? "",
					name,
					compileStatus,
					hasPdf: compileStatus === "ready",
					previewUrl: null,
					companyName: null,
					roleTitle: null,
					jobLink: null,
					compileError: null,
					compiledAt: null,
					createdAt: "",
					updatedAt: "",
				} satisfies ResumeListItem)
			: undefined,
		refetchInterval: (query) => {
			const status = query.state.data?.compileStatus ?? compileStatus;
			return status && isResumeCompiling(status) ? 750 : false;
		},
	});

	const status = data?.compileStatus ?? compileStatus ?? "ready";
	const pending = isResumeCompiling(status);
	const failed = status === "failed";
	const wasPending = useRef(pending);

	useEffect(() => {
		if (wasPending.current && !pending && !failed) {
			trackEvent(MixpanelEvent.ResumePdfReady, {
				resume_id: resumeId ?? "",
			});
		}
		wasPending.current = pending;
	}, [failed, pending, resumeId]);
	const fileName = (data?.name || name).toLowerCase().endsWith(".pdf")
		? data?.name || name
		: `${data?.name || name}.pdf`;
	const href = pending || failed ? undefined : previewUrl;
	const downloadHref = pending || failed
		? undefined
		: resumeId
			? resumeDownloadPath(resumeId, { download: true })
			: downloadUrl;
	const subtitle = failed
		? "PDF failed"
		: pending
			? "Creating PDF"
			: "PDF";

	const inner = (
		<>
			<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#e53935] text-white">
				{pending ? (
					<CircleNotchIcon size={16} className="animate-spin" />
				) : (
					<span className="text-[9px] font-semibold tracking-wide">PDF</span>
				)}
			</span>
			<span className="flex min-w-0 flex-col justify-center gap-0.5">
				<span className="truncate text-sm font-medium leading-tight">
					{fileName}
				</span>
				<span className="text-[12px] leading-none text-muted-foreground">
					{subtitle}
				</span>
			</span>
		</>
	);

	if (!href || !downloadHref) {
		return (
			<div
				className={cn(
					"inline-flex max-w-[min(100%,20rem)] items-center gap-2.5 rounded-3xl bg-secondary px-3 py-2.5 text-foreground",
					className,
				)}
			>
				{inner}
			</div>
		);
	}

	return (
		<div
			className={cn(
				"inline-flex w-fit max-w-[min(100%,20rem)] items-center gap-1 rounded-3xl bg-secondary py-1.5 pl-3 pr-1.5 text-foreground",
				className,
			)}
		>
			<a
				href={href}
				target="_blank"
				rel="noreferrer"
				className="flex min-w-0 items-center gap-2.5 py-1 transition-opacity hover:opacity-90"
				onClick={() => {
					trackEvent(MixpanelEvent.ResumePdfOpened, {
						resume_id: resumeId ?? "",
					});
				}}
			>
				{inner}
			</a>
			<a
				href={downloadHref}
				download={fileName}
				className="flex size-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-background/70"
				aria-label={`Download ${fileName}`}
				onClick={() => {
					trackEvent(MixpanelEvent.ResumePdfDownloaded, {
						resume_id: resumeId ?? "",
					});
				}}
			>
				<DownloadSimpleIcon size={18} weight="bold" />
			</a>
		</div>
	);
}
