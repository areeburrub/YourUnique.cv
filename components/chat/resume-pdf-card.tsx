"use client";

import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";

import {
	isResumeCompiling,
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
	const fileName = (data?.name || name).toLowerCase().endsWith(".pdf")
		? data?.name || name
		: `${data?.name || name}.pdf`;
	const href = pending || failed ? undefined : previewUrl;
	const subtitle = failed
		? "PDF failed"
		: pending
			? "Creating PDF"
			: "PDF";

	const inner = (
		<>
			<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#e53935] text-white">
				{pending ? (
					<LoaderCircle className="size-4 animate-spin" />
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

	if (!href) {
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
		<a
			href={href}
			target="_blank"
			rel="noreferrer"
			className={cn(
				"inline-flex max-w-[min(100%,20rem)] items-center gap-2.5 rounded-3xl bg-secondary px-3 py-2.5 text-foreground transition-opacity hover:opacity-90",
				className,
			)}
		>
			{inner}
		</a>
	);
}
