"use client";

import { ArrowLeftIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { isResumeCompiling, type ResumeListItem } from "@/lib/resumes";

import { ResumeCard } from "../../../_components/resume-card";

function formatVersionCaption(resume: ResumeListItem, isCurrent: boolean) {
	const when = new Date(resume.createdAt).toLocaleString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
	return isCurrent
		? `Version ${resume.version} · Current · ${when}`
		: `Version ${resume.version} · ${when}`;
}

type ResumeHistoryProps = {
	initialVersions: ResumeListItem[];
};

export function ResumeHistory({ initialVersions }: ResumeHistoryProps) {
	const [versions, setVersions] = useState(initialVersions);
	const currentId = versions[0]?.id;

	const refresh = useCallback(async () => {
		if (!currentId) {
			return;
		}
		const res = await fetch(`/api/resumes/${currentId}/versions`);
		if (!res.ok) {
			return;
		}
		const data = (await res.json()) as { versions: ResumeListItem[] };
		setVersions(data.versions);
	}, [currentId]);

	useEffect(() => {
		setVersions(initialVersions);
	}, [initialVersions]);

	const hasInFlight = versions.some((resume) =>
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

	const title =
		versions[0]?.roleTitle?.trim() || versions[0]?.name || "Resume";
	const latestVersion = versions[0]?.version ?? 1;

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<div className="shrink-0 border-b border-border px-4 py-5 sm:px-6">
				<div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
					<Link
						href="/resumes"
						className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
					>
						<ArrowLeftIcon size={14} weight="bold" />
						Resumes
					</Link>
					<div className="min-w-0">
						<h1 className="font-display text-[24px] font-medium tracking-[-0.48px] text-foreground">
							{title}
						</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							{versions.length}{" "}
							{versions.length === 1 ? "version" : "versions"}. Opening an
							older version keeps that PDF as it was.
						</p>
					</div>
				</div>
			</div>

			<div className="min-h-0 flex-1 overflow-auto">
				<div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
					<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
						{versions.map((resume) => (
							<ResumeCard
								key={resume.id}
								resume={resume}
								showHistoryLink={false}
								versionCaption={formatVersionCaption(
									resume,
									resume.version === latestVersion,
								)}
							/>
						))}
					</div>
					{hasInFlight ? (
						<p className="px-2 py-6 text-center text-[12px] text-muted-soft">
							Refreshing while PDFs compile…
						</p>
					) : null}
				</div>
			</div>
		</div>
	);
}
