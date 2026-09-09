"use client";

import Link from "next/link";
import {
	Bookmark,
	BookmarkCheck,
	ExternalLink,
	Lock,
	Settings2,
	SatelliteDish,
	Sparkles,
	ThumbsDown,
	X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	JobRadarPreferencesDialog,
	type RadarPreferencesState,
} from "@/components/radar/job-radar-preferences-dialog";
import { JobRadarPreferencesForm } from "@/components/radar/job-radar-preferences-form";
import { JobRadarProDialog } from "@/components/radar/job-radar-pro-dialog";
import { JobRadarProHeader } from "@/components/radar/job-radar-pro-header";
import { JobRadarSearchingBanner } from "@/components/radar/job-radar-searching-banner";
import { RadarActiveBadge } from "@/components/radar/radar-active-badge";
import { useIsMobile } from "@/hooks/use-mobile";
import {
	isRadarTrackerStatus,
	RADAR_TRACKER_STATUSES,
	type RadarTrackerStatus,
} from "@/lib/radar-tracker";
import {
	parseRadarSeniorityFit,
	RADAR_SENIORITY_FIT_LABELS,
} from "@/lib/radar-seniority";
import type { RadarAtsGap } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const TRACKER_LABELS: Record<RadarTrackerStatus, string> = {
	new: "New",
	saved: "Saved",
	applied: "Applied",
	interviewing: "Interviewing",
	offer: "Offer",
	rejected: "Rejected",
};

type StatusFilter = "all" | RadarTrackerStatus;

type RadarJobCard = {
	id: string;
	rank: number;
	atsScore: number;
	verdict: string;
	summary: string;
	blurred: boolean;
	title: string | null;
	company: string | null;
	location: string | null;
	workplace: string | null;
	url: string | null;
	batchDate: string;
	trackerStatus: RadarTrackerStatus;
	seniorityFit: string;
	strengths: string[];
	gaps: RadarAtsGap[];
};

type RadarJobsResponse = {
	jobs: RadarJobCard[];
	total: number;
	visible: number;
	moreCount: number;
	canRefresh: boolean;
	isPaid: boolean;
	newToday: RadarJobCard[];
	run: {
		id: string;
		status: string;
		error?: string | null;
	} | null;
};

const EMPTY_JOBS: RadarJobCard[] = [];

async function fetchRadarJobs() {
	const res = await fetch("/api/radar/jobs", { cache: "no-store" });
	const body = (await res.json()) as RadarJobsResponse & { error?: string };
	if (!res.ok) {
		throw new Error(body.error || "Failed to load jobs");
	}
	return body;
}

export function JobRadarClient({
	hasProfile,
}: {
	hasProfile: boolean;
}) {
	const [data, setData] = useState<RadarJobsResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [searching, setSearching] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [preferences, setPreferences] = useState<RadarPreferencesState | null>(
		null,
	);
	const [prefsLoaded, setPrefsLoaded] = useState(false);
	const [prefsOpen, setPrefsOpen] = useState(false);
	const [pendingSearch, setPendingSearch] = useState(false);
	const [activeJobId, setActiveJobId] = useState<string | null>(null);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [toast, setToast] = useState<string | null>(null);
	const [proOpen, setProOpen] = useState(false);
	const isMobile = useIsMobile();

	const loadPreferences = useCallback(async () => {
		try {
			const res = await fetch("/api/radar/preferences", { cache: "no-store" });
			const body = (await res.json()) as { preferences: RadarPreferencesState | null };
			setPreferences(body.preferences ?? null);
		} finally {
			setPrefsLoaded(true);
		}
	}, []);

	useEffect(() => {
		void loadPreferences();
	}, [loadPreferences]);

	const load = useCallback(async () => {
		try {
			const body = await fetchRadarJobs();
			setData(body);
			setError(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		let cancelled = false;
		void fetchRadarJobs()
			.then((body) => {
				if (cancelled) {
					return;
				}
				setData(body);
				setError(null);
			})
			.catch((err: unknown) => {
				if (cancelled) {
					return;
				}
				setError(err instanceof Error ? err.message : "Failed to load");
			})
			.finally(() => {
				if (!cancelled) {
					setLoading(false);
				}
			});
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		if (!toast) {
			return;
		}
		const timer = setTimeout(() => setToast(null), 4000);
		return () => clearTimeout(timer);
	}, [toast]);

	useEffect(() => {
		const running =
			data?.run?.status === "queued" || data?.run?.status === "running";
		if (!running) {
			return;
		}
		const timer = setInterval(() => {
			void load();
		}, 8000);
		return () => clearInterval(timer);
	}, [data?.run?.status, load]);

	async function runSearch() {
		setSearching(true);
		setError(null);
		try {
			const res = await fetch("/api/radar/search", { method: "POST" });
			const body = (await res.json()) as {
				error?: string;
				needsPreferences?: boolean;
			};
			if (!res.ok) {
				if (body.needsPreferences) {
					setPendingSearch(true);
					setPrefsOpen(true);
					return;
				}
				if (res.status === 409) {
					await load();
					return;
				}
				throw new Error(body.error || "Could not start search");
			}
			await load();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not start search");
		} finally {
			setSearching(false);
		}
	}

	async function startSearch() {
		if (!prefsLoaded) {
			return;
		}
		if (!preferences || !preferences.currentLocation) {
			setPendingSearch(true);
			setPrefsOpen(true);
			return;
		}
		await runSearch();
	}

	function patchJob(jobId: string, patch: Partial<RadarJobCard>) {
		setData((prev) =>
			prev
				? {
						...prev,
						jobs: prev.jobs.map((j) => (j.id === jobId ? { ...j, ...patch } : j)),
						newToday: prev.newToday.map((j) =>
							j.id === jobId ? { ...j, ...patch } : j,
						),
					}
				: prev,
		);
	}

	async function dismissJob(jobId: string) {
		setData((prev) =>
			prev
				? {
						...prev,
						jobs: prev.jobs.filter((j) => j.id !== jobId),
						newToday: prev.newToday.filter((j) => j.id !== jobId),
					}
				: prev,
		);
		setActiveJobId((id) => (id === jobId ? null : id));
		setToast("We will not show jobs like this");
		try {
			await fetch(`/api/radar/jobs/${jobId}/dismiss`, { method: "POST" });
		} catch {
			// best-effort; a stale card reappearing on refresh isn't harmful
		}
	}

	async function setStatus(jobId: string, status: RadarTrackerStatus) {
		patchJob(jobId, { trackerStatus: status });
		try {
			const res = await fetch(`/api/radar/jobs/${jobId}/status`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status }),
			});
			if (!res.ok) {
				await load();
			}
		} catch {
			await load();
		}
	}

	const running =
		data?.run?.status === "queued" || data?.run?.status === "running";
	const jobs = useMemo(() => data?.jobs ?? EMPTY_JOBS, [data]);
	const badgeCount = data?.isPaid
		? data.total
		: data
			? data.visible
			: 0;
	const statusCounts = useMemo(() => {
		const counts = Object.fromEntries(
			RADAR_TRACKER_STATUSES.map((status) => [status, 0]),
		) as Record<RadarTrackerStatus, number>;
		for (const job of jobs) {
			counts[job.trackerStatus] += 1;
		}
		return counts;
	}, [jobs]);
	const filteredJobs =
		statusFilter === "all"
			? jobs
			: jobs.filter((job) => job.trackerStatus === statusFilter);
	const filteredNewToday =
		statusFilter === "all"
			? (data?.newToday ?? [])
			: (data?.newToday ?? []).filter(
					(job) => job.trackerStatus === statusFilter,
				);
	const activeJob =
		[...(data?.newToday ?? []), ...jobs].find((j) => j.id === activeJobId) ??
		null;
	const showSetupForm =
		!loading &&
		!running &&
		jobs.length === 0 &&
		hasProfile &&
		!(data && !data.isPaid && data.run?.status === "ready");

	return (
		<div className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
			<div className="flex items-center justify-between gap-3 py-3">
				<div className="flex min-w-0 items-center gap-2">
					<h1 className="font-display text-lg font-medium tracking-[-0.3px] text-foreground">
						Job Radar
					</h1>
					{!loading ? (
						<Badge aria-label={`${badgeCount} jobs`}>{badgeCount}</Badge>
					) : !data ? (
						<Skeleton className="h-5 w-6 rounded-full" />
					) : null}
				</div>
				<div className="flex shrink-0 items-center gap-2">
					{data?.isPaid && hasProfile && !showSetupForm ? (
						<RadarActiveBadge />
					) : null}
					{hasProfile && !showSetupForm ? (
						<Button
							type="button"
							variant="outline"
							size="icon"
							aria-label="Job search preferences"
							onClick={() => {
								setPendingSearch(false);
								setPrefsOpen(true);
							}}
						>
							<Settings2 size={16} />
						</Button>
					) : null}
					{/* Pro searches are fully automatic (page load / upgrade / daily
					cron all share the same trigger logic) — no manual refresh. Free
					plan gets one search and can only retry if it failed. */}
					{hasProfile &&
					!running &&
					!!data?.total &&
					!data?.isPaid &&
					(!data?.run || data.run.status === "failed") ? (
						<Button
							type="button"
							size="sm"
							onClick={() => void startSearch()}
							disabled={searching || !prefsLoaded}
						>
							{searching ? "Starting…" : "Retry search"}
						</Button>
					) : null}
				</div>
			</div>

			<JobRadarProDialog open={proOpen} onOpenChange={setProOpen} />
			<JobRadarPreferencesDialog
				open={prefsOpen}
				onOpenChange={setPrefsOpen}
				initial={preferences}
				onSaved={(saved) => {
					setPreferences(saved);
					setPrefsLoaded(true);
					if (pendingSearch) {
						setPendingSearch(false);
						void runSearch();
					}
				}}
			/>

			<div className="space-y-5">
				{data && !data.isPaid && jobs.length > 0 ? (
					<JobRadarProHeader onUpgrade={() => setProOpen(true)} />
				) : null}

				{error ? (
					<p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						{error}
					</p>
				) : null}

				{running ? (
					<JobRadarSearchingBanner
						isPaid={Boolean(data?.isPaid)}
						compact={jobs.length > 0}
					/>
				) : null}

				{loading && !data ? <JobListSkeleton /> : null}

				{!loading && !running && jobs.length === 0 ? (
					!hasProfile ? (
						<div className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
							<div className="flex size-16 items-center justify-center rounded-lg bg-pastel-blush text-brand">
								<SatelliteDish size={28} />
							</div>
							<div className="space-y-1">
								<h2 className="font-medium text-sm">No roles on radar yet</h2>
								<p className="max-w-sm text-sm text-muted-foreground">
									Finish your career profile first so radar has something to
									scan against.
								</p>
							</div>
							<Button nativeButton={false} render={<Link href="/onboarding" />}>
								Complete profile
							</Button>
						</div>
					) : data && !data.isPaid && data.run?.status === "ready" ? (
						<div className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
							<div className="flex size-16 items-center justify-center rounded-lg bg-pastel-blush text-brand">
								<SatelliteDish size={28} />
							</div>
							<div className="space-y-1">
								<h2 className="font-medium text-sm">No roles on radar yet</h2>
								<p className="max-w-sm text-sm text-muted-foreground">
									This search did not return roles we can show yet. Upgrade to
									Pro for daily matches.
								</p>
							</div>
							<Button type="button" onClick={() => setProOpen(true)}>
								Upgrade to Pro
							</Button>
						</div>
					) : (
						<div className="mx-auto w-full max-w-lg py-4">
							<div className="mb-5 space-y-1">
								<h2 className="font-display text-xl font-medium tracking-[-0.3px]">
									Enable Job Radar
								</h2>
								<p className="text-sm text-muted-foreground">
									Tell us where you are and how you like to work. We&rsquo;ll
									match your profile against the live job corpus. Free accounts
									get one search.
								</p>
							</div>
							<JobRadarPreferencesForm
								initial={preferences}
								submitLabel="Enable Radar"
								busyLabel="Starting…"
								submitting={searching}
								onSubmit={async (saved) => {
									setPreferences(saved);
									setPrefsLoaded(true);
									await runSearch();
								}}
							/>
						</div>
					)
				) : null}

				{jobs.length > 0 ? (
					<div
						role="tablist"
						aria-label="Filter by status"
						className="-mx-1 flex min-w-0 gap-1 overflow-x-auto px-1 scrollbar-none"
					>
						<StatusFilterChip
							selected={statusFilter === "all"}
							count={jobs.length}
							onClick={() => setStatusFilter("all")}
						>
							All
						</StatusFilterChip>
						{RADAR_TRACKER_STATUSES.map((status) => (
							<StatusFilterChip
								key={status}
								selected={statusFilter === status}
								count={statusCounts[status]}
								onClick={() => setStatusFilter(status)}
							>
								{TRACKER_LABELS[status]}
							</StatusFilterChip>
						))}
					</div>
				) : null}

				{data?.isPaid && filteredNewToday.length > 0 && statusFilter === "all" ? (
					<section className="space-y-2">
						<h2 className="text-sm font-medium">New today</h2>
						<div className="grid min-w-0 gap-2">
							{filteredNewToday.map((job) => (
								<JobCard
									key={`today-${job.id}`}
									job={job}
									onOpen={() => setActiveJobId(job.id)}
									onUnlock={() => setProOpen(true)}
									onSave={() =>
										void setStatus(
											job.id,
											job.trackerStatus === "saved" ? "new" : "saved",
										)
									}
									onDismiss={() => void dismissJob(job.id)}
								/>
							))}
						</div>
					</section>
				) : null}

				{filteredJobs.length > 0 ? (
					<section className="space-y-2">
						<div className="grid min-w-0 gap-2">
							{filteredJobs.map((job) => (
								<JobCard
									key={job.id}
									job={job}
									onOpen={() => setActiveJobId(job.id)}
									onUnlock={() => setProOpen(true)}
									onSave={() =>
										void setStatus(
											job.id,
											job.trackerStatus === "saved" ? "new" : "saved",
										)
									}
									onDismiss={() => void dismissJob(job.id)}
								/>
							))}
						</div>
					</section>
				) : jobs.length > 0 ? (
					<p className="px-1 py-8 text-center text-sm text-muted-foreground">
						{statusFilter === "all"
							? "No roles in this list."
							: `No ${TRACKER_LABELS[statusFilter].toLowerCase()} roles yet.`}
					</p>
				) : null}

				{data && !data.isPaid && jobs.length > 0 ? (
					<div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-4 text-center">
						<p className="text-sm font-medium text-foreground">
							Get 200+ new roles scanned daily
						</p>
						<p className="mt-1 text-sm text-muted-foreground">
							Pro re-runs your search every day and alerts you as soon as a
							strong new match is posted — no more manually checking back.
						</p>
						<Button className="mt-3" type="button" onClick={() => setProOpen(true)}>
							Upgrade to Pro
						</Button>
					</div>
				) : null}
			</div>

			<JobDetailPanel
				job={activeJob}
				isMobile={isMobile}
				open={activeJobId != null}
				onOpenChange={(open) => {
					if (!open) setActiveJobId(null);
				}}
				onStatus={(status) => {
					if (activeJob) void setStatus(activeJob.id, status);
				}}
				onDismiss={() => {
					if (activeJob) void dismissJob(activeJob.id);
				}}
			/>

			{toast ? (
				<div
					role="status"
					className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-border bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-lg"
				>
					{toast}
				</div>
			) : null}
		</div>
	);
}

function StatusFilterChip({
	selected,
	count,
	onClick,
	children,
}: {
	selected: boolean;
	count: number;
	onClick: () => void;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			role="tab"
			aria-selected={selected}
			onClick={onClick}
			className={cn(
				"inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
				selected
					? "border-foreground/15 bg-foreground text-background"
					: "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
			)}
		>
			{children}
			<span
				className={cn(
					"tabular-nums",
					selected ? "text-background/70" : "text-muted-foreground",
				)}
			>
				{count}
			</span>
		</button>
	);
}

function JobListSkeleton() {
	return (
		<section className="space-y-2" aria-hidden>
			<div className="grid min-w-0 gap-2">
				{Array.from({ length: 6 }).map((_, i) => (
					<JobCardSkeleton key={i} />
				))}
			</div>
		</section>
	);
}

function JobCardSkeleton() {
	return (
		<div className="min-w-0 overflow-hidden rounded-lg border border-border bg-card p-3.5">
			<div className="flex min-w-0 items-start gap-2">
				<div className="min-w-0 flex-1 space-y-2">
					<Skeleton className="h-4 w-3/4" />
					<Skeleton className="h-3 w-2/5" />
				</div>
				<Skeleton className="h-5 w-8 shrink-0 rounded-full" />
			</div>
			<div className="mt-3 flex items-center justify-between gap-2">
				<Skeleton className="h-7 w-28 rounded-full" />
				<div className="-mr-1.5 flex shrink-0 items-center gap-1">
					<Skeleton className="size-9 rounded-full" />
					<Skeleton className="size-9 rounded-full" />
				</div>
			</div>
		</div>
	);
}

function JobCard({
	job,
	onOpen,
	onUnlock,
	onSave,
	onDismiss,
}: {
	job: RadarJobCard;
	onOpen?: () => void;
	onUnlock?: () => void;
	onSave?: () => void;
	onDismiss?: () => void;
}) {
	const locked = job.blurred;
	const saved = job.trackerStatus === "saved";
	const meta = locked
		? "Company name · Location"
		: [job.company, job.location].filter(Boolean).join(" · ");
	const score = Number.isFinite(job.atsScore) ? Math.round(job.atsScore) : null;
	const scoreBadge = (
		<div
			className={cn(
				"shrink-0 rounded-full px-2 py-0.5 text-sm font-medium tabular-nums",
				score != null && score >= 75
					? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
					: score != null && score >= 60
						? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
						: "bg-muted text-muted-foreground",
			)}
		>
			{score ?? "—"}
		</div>
	);

	if (locked) {
		return (
			<button
				type="button"
				onClick={onUnlock}
				className="block w-full min-w-0 overflow-hidden rounded-lg border border-border bg-card p-3.5 text-left transition-colors hover:border-foreground/20"
			>
				<div className="flex min-w-0 gap-2">
					<div className="min-w-0 flex-1">
						<h3 className="wrap-break-word text-[15px] font-medium leading-snug">
							{job.title || "Matching role"}
						</h3>
						<p
							className="mt-0.5 truncate text-xs text-muted-foreground select-none blur-[5px]"
							aria-hidden
						>
							{meta}
						</p>
					</div>
					<div className="flex shrink-0 flex-col items-end justify-between gap-2">
						{scoreBadge}
						<span className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
							<Lock size={12} />
							Pro
						</span>
					</div>
				</div>
			</button>
		);
	}

	return (
		<article className="min-w-0 overflow-hidden rounded-lg border border-border bg-card p-3.5">
			<div className="flex min-w-0 items-start gap-2">
				<button
					type="button"
					onClick={onOpen}
					className="min-w-0 flex-1 cursor-pointer text-left"
				>
					<h3 className="wrap-break-word text-[15px] font-medium leading-snug underline-offset-2 hover:underline">
						{job.title || "Matching role"}
					</h3>
					<p className="mt-0.5 truncate text-xs text-muted-foreground">
						{meta}
					</p>
				</button>
				{scoreBadge}
			</div>

			<div className="mt-2 flex min-w-0 items-center justify-between gap-2">
				{job.url ? (
					<Button
						variant="outline"
						size="xs"
						nativeButton={false}
						render={<a href={job.url} target="_blank" rel="noreferrer" />}
					>
						<ExternalLink size={14} />
						Go to job post
					</Button>
				) : (
					<span />
				)}
				<div className="-mr-1.5 flex shrink-0 items-center">
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-pressed={saved}
						aria-label={saved ? "Saved" : "Save job"}
						onClick={onSave}
						className={saved ? "text-foreground" : "text-muted-foreground"}
					>
						{saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-label="Not relevant"
						onClick={onDismiss}
						className="text-muted-foreground hover:text-destructive"
					>
						<ThumbsDown size={16} />
					</Button>
				</div>
			</div>
		</article>
	);
}

function JobDetailBody({
	job,
	onStatus,
	onDismiss,
}: {
	job: RadarJobCard;
	onStatus?: (status: RadarTrackerStatus) => void;
	onDismiss?: () => void;
}) {
	const saved = job.trackerStatus === "saved";
	const score = Number.isFinite(job.atsScore) ? Math.round(job.atsScore) : null;
	const meta = [job.company, job.location, job.workplace]
		.filter(Boolean)
		.join(" · ");
	const gapTerms = job.gaps.map((g) => g.term).filter(Boolean);
	const strengthTerms = job.strengths;
	const seniorityFit = parseRadarSeniorityFit(job.seniorityFit);
	const seniorityLabel = RADAR_SENIORITY_FIT_LABELS[seniorityFit];

	return (
		<div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
			<div
				className={cn(
					"inline-flex w-fit shrink-0 rounded-full px-2.5 py-1 text-sm font-medium tabular-nums",
					score != null && score >= 75
						? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
						: score != null && score >= 60
							? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
							: "bg-muted text-muted-foreground",
				)}
			>
				{score ?? "—"} match
			</div>
			{seniorityLabel ? (
				<p className="mt-1.5 text-xs text-muted-foreground">{seniorityLabel}</p>
			) : null}

			<h2 className="mt-2 text-lg leading-snug font-semibold text-foreground">
				{job.title}
			</h2>
			{meta ? (
				<p className="mt-1 text-sm text-muted-foreground">{meta}</p>
			) : null}

			<div className="mt-3 flex items-center gap-2">
				{job.url ? (
					<Button
						variant="outline"
						size="sm"
						className="flex-1"
						nativeButton={false}
						render={<a href={job.url} target="_blank" rel="noreferrer" />}
					>
						<ExternalLink size={14} />
						Open posting
					</Button>
				) : (
					<span className="flex-1" />
				)}
				<Button
					type="button"
					variant={saved ? "secondary" : "outline"}
					size="icon-sm"
					aria-pressed={saved}
					aria-label={saved ? "Saved" : "Save job"}
					onClick={() => onStatus?.(saved ? "new" : "saved")}
				>
					{saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
				</Button>
				<Button
					type="button"
					variant="outline"
					size="icon-sm"
					aria-label="Not relevant"
					onClick={onDismiss}
					className="text-muted-foreground hover:text-destructive"
				>
					<ThumbsDown size={14} />
				</Button>
			</div>

			{job.summary ? (
				<p className="mt-4 text-sm text-foreground/90">{job.summary}</p>
			) : null}

			{strengthTerms.length > 0 || gapTerms.length > 0 ? (
				<div className="mt-3 flex flex-wrap gap-1.5">
					{strengthTerms.map((term) => (
						<span
							key={`s-${term}`}
							className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-700 dark:text-emerald-400"
						>
							{term}
						</span>
					))}
					{gapTerms.map((term) => (
						<span
							key={`g-${term}`}
							className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
						>
							Missing {term}
						</span>
					))}
				</div>
			) : null}

			<div className="mt-5 border-t border-border pt-4">
				<div className="flex items-center justify-between gap-2">
					<span className="text-sm font-medium text-foreground">Status</span>
					<Select
						value={job.trackerStatus}
						onValueChange={(value) => {
							if (typeof value === "string" && isRadarTrackerStatus(value)) {
								onStatus?.(value);
							}
						}}
					>
						<SelectTrigger
							size="sm"
							aria-label="Edit application status"
							className="min-w-28"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent align="end" alignItemWithTrigger={false}>
							{RADAR_TRACKER_STATUSES.map((status) => (
								<SelectItem key={status} value={status}>
									{TRACKER_LABELS[status]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<Button
					className="mt-3 w-full"
					size="sm"
					nativeButton={false}
					render={<Link href={`/new-chat?radarJobId=${job.id}`} />}
				>
					<Sparkles size={14} />
					Generate CV
				</Button>
			</div>
		</div>
	);
}

function JobDetailPanel({
	job,
	isMobile,
	open,
	onOpenChange,
	onStatus,
	onDismiss,
}: {
	job: RadarJobCard | null;
	isMobile: boolean;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onStatus?: (status: RadarTrackerStatus) => void;
	onDismiss?: () => void;
}) {
	const title = job?.title || "Matching role";

	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
				<DrawerContent className="data-[swipe-axis=y]:[--drawer-content-height:85dvh] data-[swipe-axis=y]:[--drawer-content-max-height:85dvh]">
					<DrawerHeader className="relative min-h-0 justify-center p-2">
						<DrawerTitle className="sr-only">{title}</DrawerTitle>
						<DrawerClose
							render={
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									className="absolute top-2 right-2"
								/>
							}
						>
							<X size={16} />
							<span className="sr-only">Close</span>
						</DrawerClose>
					</DrawerHeader>
					{job ? (
						<JobDetailBody job={job} onStatus={onStatus} onDismiss={onDismiss} />
					) : null}
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="w-full sm:max-w-md">
				<SheetHeader className="p-2">
					<SheetTitle className="sr-only">{title}</SheetTitle>
				</SheetHeader>
				{job ? (
					<JobDetailBody job={job} onStatus={onStatus} onDismiss={onDismiss} />
				) : null}
			</SheetContent>
		</Sheet>
	);
}
