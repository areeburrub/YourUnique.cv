"use client";

import { ChatCircleIcon, FileTextIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useSoftNav } from "@/components/app/soft-nav";
import { Button } from "@/components/ui/button";
import { groupResumesByDate, isResumeCompiling, type ResumeListItem } from "@/lib/resumes";

import { ResumeCard } from "./resume-card";

type ResumesIndexProps = {
	initialResumes: ResumeListItem[];
};

export function ResumesIndex({ initialResumes }: ResumesIndexProps) {
	const { openNewChat } = useSoftNav();
	const [resumes, setResumes] = useState(initialResumes);

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
							className="shrink-0"
							onClick={openNewChat}
						>
							<ChatCircleIcon data-icon="inline-start" weight="bold" />
							New chat
						</Button>
					</div>
				</div>
			</div>

			<div className="min-h-0 flex-1 overflow-auto">
				<div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
					{resumes.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
							<div className="flex size-16 items-center justify-center rounded-[22px] bg-pastel-blush text-brand">
								<FileTextIcon size={28} weight="duotone" />
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
								className="mt-1"
								onClick={openNewChat}
							>
								<ChatCircleIcon data-icon="inline-start" weight="bold" />
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
											<ResumeCard key={resume.id} resume={resume} />
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
		</div>
	);
}
