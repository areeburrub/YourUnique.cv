"use client";

import { useQuery } from "@tanstack/react-query";
import { DownloadSimpleIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

import { SparkleShuffle } from "@/components/ui/sparkle-shuffle";
import { MixpanelEvent, trackEvent } from "@/lib/mixpanel";
import {
	isResumeCompiling,
	resumeDownloadPath,
	resumeIdFromDownloadUrl,
	resumeStatusKey,
	type ResumeListItem,
} from "@/lib/resumes";
import { cn } from "@/lib/utils";

const COMPILE_ESTIMATE_MS = 30_000;

function formatCompileRemaining(ms: number) {
	const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function useCompileCountdown(active: boolean) {
	const startedAtRef = useRef<number | null>(null);
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		if (!active) {
			startedAtRef.current = null;
			return;
		}

		startedAtRef.current ??= Date.now();
		setNow(Date.now());
		const timer = window.setInterval(() => {
			setNow(Date.now());
		}, 200);
		return () => window.clearInterval(timer);
	}, [active]);

	if (!active || startedAtRef.current == null) {
		return COMPILE_ESTIMATE_MS;
	}

	return Math.max(0, COMPILE_ESTIMATE_MS - (now - startedAtRef.current));
}

function CompileSparkle({ remainingMs }: { remainingMs: number }) {
	const finished = remainingMs <= 0;
	const label = finished
		? "Generating PDF"
		: `Generating, ${formatCompileRemaining(remainingMs)} estimated`;

	return (
		<span
			className="flex size-9 shrink-0 items-center justify-center text-brand"
			role="status"
			aria-live="polite"
			aria-label={label}
		>
			<SparkleShuffle size={28} />
		</span>
	);
}

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
					familyId: resumeId ?? "",
					version: 1,
					versionCount: 1,
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
	const remainingMs = useCompileCountdown(pending);
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
			? remainingMs > 0
				? `Generating, ${formatCompileRemaining(remainingMs)} est.`
				: "Generating…"
			: "PDF";

	const inner = (
		<>
			<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#e53935] text-white">
				<span className="text-[9px] font-semibold tracking-wide">PDF</span>
			</span>
			<span className="flex min-w-0 flex-col justify-center gap-0.5">
				<span className="truncate text-sm font-medium leading-tight">
					{fileName}
				</span>
				<span
					className={cn(
						"text-[12px] leading-none text-muted-foreground",
						pending && "tabular-nums",
					)}
					aria-hidden={pending}
				>
					{subtitle}
				</span>
			</span>
		</>
	);

	if (failed || (!pending && (!href || !downloadHref))) {
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
			aria-busy={pending}
		>
			{href && downloadHref ? (
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
			) : (
				<div className="flex min-w-0 items-center gap-2.5 py-1">{inner}</div>
			)}
			{pending ? (
				<CompileSparkle remainingMs={remainingMs} />
			) : (
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
			)}
		</div>
	);
}
