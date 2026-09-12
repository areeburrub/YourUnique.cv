"use client";

import Link from "next/link";
import {
	ChevronDown,
	ExternalLink,
	Loader2,
	Lock,
	Settings2,
	SatelliteDish,
	Sparkles,
	ThumbsDown,
} from "lucide-react";
import {
	BookmarkSimpleIcon,
	CaretDownIcon,
	CheckCircleIcon,
	CircleDashedIcon,
	CircleHalfIcon,
	CircleHalfTiltIcon,
	FunnelSimpleIcon,
	XCircleIcon,
	type Icon,
	type IconWeight,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";

import {
	Accordion,
	AccordionHeader,
	AccordionItem,
	AccordionPanel,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	JobRadarPreferencesDialog,
	type RadarPreferencesState,
} from "@/components/radar/job-radar-preferences-dialog";
import { JobRadarPreferencesForm } from "@/components/radar/job-radar-preferences-form";
import { JobRadarProDialog } from "@/components/radar/job-radar-pro-dialog";
import { JobRadarProHeader } from "@/components/radar/job-radar-pro-header";
import { JobRadarSearchingBanner } from "@/components/radar/job-radar-searching-banner";
import { RadarActiveBadge } from "@/components/radar/radar-active-badge";
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

const TRACKER_STATUS_ICON: Record<
	RadarTrackerStatus,
	{ Icon: Icon; weight: IconWeight; className: string }
> = {
	new: {
		Icon: CircleDashedIcon,
		weight: "bold",
		className: "text-muted-foreground",
	},
	saved: {
		Icon: BookmarkSimpleIcon,
		weight: "bold",
		className: "text-sky-500",
	},
	applied: {
		Icon: CircleHalfIcon,
		weight: "bold",
		className: "text-amber-400",
	},
	interviewing: {
		Icon: CircleHalfTiltIcon,
		weight: "bold",
		className: "text-yellow-500",
	},
	offer: {
		Icon: CheckCircleIcon,
		weight: "fill",
		className: "text-violet-500",
	},
	rejected: {
		Icon: XCircleIcon,
		weight: "bold",
		className: "text-red-500",
	},
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
	statusCounts: Record<RadarTrackerStatus, number>;
	newToday: RadarJobCard[];
	nextOffset: number;
	listedTotal: number;
	hasMore: boolean;
	run: {
		id: string;
		status: string;
		error?: string | null;
	} | null;
};

const EMPTY_JOBS: RadarJobCard[] = [];
const EMPTY_STATUS_COUNTS = Object.fromEntries(
	RADAR_TRACKER_STATUSES.map((status) => [status, 0]),
) as Record<RadarTrackerStatus, number>;

async function fetchRadarJobs(status: StatusFilter = "all", offset = 0) {
	const params = new URLSearchParams();
	if (status !== "all") {
		params.set("status", status);
	}
	if (offset > 0) {
		params.set("offset", String(offset));
	}
	const qs = params.toString();
	const res = await fetch(`/api/radar/jobs${qs ? `?${qs}` : ""}`, {
		cache: "no-store",
	});
	const body = (await res.json()) as RadarJobsResponse & { error?: string };
	if (!res.ok) {
		throw new Error(body.error || "Failed to load jobs");
	}
	return body;
}

function mergeRadarPage(
	prev: RadarJobsResponse,
	page: RadarJobsResponse,
): RadarJobsResponse {
	const seen = new Set(prev.jobs.map((job) => job.id));
	const jobs = [...prev.jobs, ...page.jobs.filter((job) => !seen.has(job.id))];
	const listedTotal = page.listedTotal ?? prev.listedTotal ?? page.total;
	const nextOffset = page.nextOffset;
	return {
		...page,
		jobs,
		newToday: prev.newToday,
		run: page.run ?? prev.run,
		nextOffset,
		listedTotal,
		hasMore: nextOffset < listedTotal,
	};
}

function applyRadarPoll(
	prev: RadarJobsResponse,
	page: RadarJobsResponse,
): RadarJobsResponse {
	const seen = new Set(prev.jobs.map((job) => job.id));
	const landed = page.jobs.filter((job) => !seen.has(job.id));
	const todaySeen = new Set(prev.newToday.map((job) => job.id));
	const listedTotal = page.listedTotal ?? prev.listedTotal ?? page.total;
	const nextOffset = prev.nextOffset;
	return {
		...page,
		jobs: [...landed, ...prev.jobs],
		newToday: [
			...page.newToday.filter((job) => !todaySeen.has(job.id)),
			...prev.newToday,
		],
		run: page.run ?? prev.run,
		nextOffset,
		listedTotal,
		hasMore: nextOffset < listedTotal,
	};
}

function getOverflowParent(el: HTMLElement | null) {
	for (let node = el?.parentElement; node; node = node.parentElement) {
		const { overflowY } = getComputedStyle(node);
		if (overflowY === "auto" || overflowY === "scroll") {
			return node;
		}
	}
	return null;
}

function responseHasMore(data: RadarJobsResponse | null | undefined) {
	if (!data) {
		return false;
	}
	if (typeof data.listedTotal === "number") {
		return data.nextOffset < data.listedTotal;
	}
	return Boolean(data.hasMore);
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
	const [openJobId, setOpenJobId] = useState<string | null>(null);
	const [hasSeededOpen, setHasSeededOpen] = useState(false);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [toast, setToast] = useState<string | null>(null);
	const [proOpen, setProOpen] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
	const loadingMoreRef = useRef(false);
	const requestSeq = useRef(0);
	const dataRef = useRef<RadarJobsResponse | null>(null);
	dataRef.current = data;

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
			const body = await fetchRadarJobs(statusFilter);
			setData((prev) => {
				if (prev && prev.nextOffset > body.jobs.length) {
					return applyRadarPoll(prev, body);
				}
				return body;
			});
			setError(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load");
		}
	}, [statusFilter]);

	const loadMore = useCallback(async () => {
		const current = dataRef.current;
		if (!current || !responseHasMore(current) || loadingMoreRef.current) {
			return;
		}
		loadingMoreRef.current = true;
		setLoadingMore(true);
		const seq = requestSeq.current;
		try {
			const body = await fetchRadarJobs(statusFilter, current.nextOffset);
			if (seq !== requestSeq.current) {
				return;
			}
			setData((prev) => (prev ? mergeRadarPage(prev, body) : body));
			setError(null);
		} catch (err) {
			if (seq !== requestSeq.current) {
				return;
			}
			setError(err instanceof Error ? err.message : "Failed to load");
		} finally {
			if (seq === requestSeq.current) {
				loadingMoreRef.current = false;
				setLoadingMore(false);
			}
		}
	}, [statusFilter]);

	useEffect(() => {
		let cancelled = false;
		const seq = ++requestSeq.current;
		loadingMoreRef.current = false;
		setLoadingMore(false);
		setLoading(true);
		void fetchRadarJobs(statusFilter)
			.then((body) => {
				if (cancelled || seq !== requestSeq.current) {
					return;
				}
				setData(body);
				setError(null);
			})
			.catch((err: unknown) => {
				if (cancelled || seq !== requestSeq.current) {
					return;
				}
				setError(err instanceof Error ? err.message : "Failed to load");
			})
			.finally(() => {
				if (!cancelled && seq === requestSeq.current) {
					setLoading(false);
				}
			});
		return () => {
			cancelled = true;
		};
	}, [statusFilter]);

	useEffect(() => {
		setHasSeededOpen(false);
		setOpenJobId(null);
	}, [statusFilter]);

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

	function changeStatusFilter(next: StatusFilter) {
		if (next === statusFilter) {
			return;
		}
		setLoading(true);
		setStatusFilter(next);
	}

	async function dismissJob(jobId: string) {
		setData((prev) => {
			if (!prev) {
				return prev;
			}
			const job =
				prev.jobs.find((j) => j.id === jobId) ??
				prev.newToday.find((j) => j.id === jobId);
			const statusCounts = {
				...EMPTY_STATUS_COUNTS,
				...prev.statusCounts,
			};
			if (job) {
				statusCounts[job.trackerStatus] = Math.max(
					0,
					statusCounts[job.trackerStatus] - 1,
				);
			}
			return {
				...prev,
				total: Math.max(0, prev.total - 1),
				listedTotal: Math.max(0, (prev.listedTotal ?? prev.total) - 1),
				hasMore:
					prev.nextOffset <
					Math.max(0, (prev.listedTotal ?? prev.total) - 1),
				statusCounts,
				jobs: prev.jobs.filter((j) => j.id !== jobId),
				newToday: prev.newToday.filter((j) => j.id !== jobId),
			};
		});
		setToast("We will not show jobs like this");
		try {
			await fetch(`/api/radar/jobs/${jobId}/dismiss`, { method: "POST" });
		} catch {
			// best-effort; a stale card reappearing on refresh isn't harmful
		}
	}

	async function setStatus(jobId: string, status: RadarTrackerStatus) {
		setData((prev) => {
			if (!prev) {
				return prev;
			}
			const current =
				prev.jobs.find((j) => j.id === jobId) ??
				prev.newToday.find((j) => j.id === jobId);
			if (!current || current.trackerStatus === status) {
				return prev;
			}
			const from = current.trackerStatus;
			const statusCounts = {
				...EMPTY_STATUS_COUNTS,
				...prev.statusCounts,
				[from]: Math.max(0, (prev.statusCounts?.[from] ?? 0) - 1),
				[status]: (prev.statusCounts?.[status] ?? 0) + 1,
			};
			const drop = statusFilter !== "all" && status !== statusFilter;
			const nextJob = { ...current, trackerStatus: status };
			const listedTotal = drop
				? Math.max(0, (prev.listedTotal ?? prev.jobs.length) - 1)
				: (prev.listedTotal ?? prev.jobs.length);
			return {
				...prev,
				statusCounts,
				listedTotal,
				hasMore: prev.nextOffset < listedTotal,
				jobs: drop
					? prev.jobs.filter((j) => j.id !== jobId)
					: prev.jobs.map((j) => (j.id === jobId ? nextJob : j)),
				newToday: drop
					? prev.newToday.filter((j) => j.id !== jobId)
					: prev.newToday.map((j) => (j.id === jobId ? nextJob : j)),
			};
		});
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
	const hasBoard = (data?.total ?? 0) > 0;
	const hasMore = responseHasMore(data);
	const badgeCount = data?.isPaid
		? data.total
		: data
			? data.visible
			: 0;
	const statusCounts = data?.statusCounts ?? EMPTY_STATUS_COUNTS;
	const newToday = data?.newToday ?? [];
	const showNewToday =
		Boolean(data?.isPaid) &&
		newToday.length > 0 &&
		statusFilter === "all";
	const newTodayIds = new Set(newToday.map((job) => job.id));
	const mainJobs = showNewToday
		? jobs.filter((job) => !newTodayIds.has(job.id))
		: jobs;
	const listedJobs = showNewToday ? [...newToday, ...mainJobs] : jobs;

	useEffect(() => {
		const node = loadMoreSentinelRef.current;
		if (!node || !hasMore || loading || loadingMore) {
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					void loadMore();
				}
			},
			{ root: getOverflowParent(node), rootMargin: "320px" },
		);
		observer.observe(node);
		return () => observer.disconnect();
	}, [hasMore, loading, loadingMore, listedJobs.length, loadMore]);
	const firstOpenableId =
		listedJobs.find((job) => !job.blurred)?.id ?? null;
	const openJobStillListed =
		openJobId != null &&
		listedJobs.some((job) => job.id === openJobId && !job.blurred);
	const derivedOpenId =
		!hasSeededOpen && firstOpenableId != null && openJobId == null
			? firstOpenableId
			: openJobStillListed
				? openJobId
				: null;
	if (derivedOpenId !== openJobId) {
		setOpenJobId(derivedOpenId);
	}
	if (!hasSeededOpen && firstOpenableId != null) {
		setHasSeededOpen(true);
	}
	const showSetupForm =
		!loading &&
		!running &&
		!hasBoard &&
		hasProfile &&
		!(data && !data.isPaid && data.run?.status === "ready");

	return (
		<div className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
			<div className="flex items-center justify-between gap-3 py-3">
				<div className="flex min-w-0 items-center gap-2">
					<h1 className="font-display text-lg font-medium tracking-[-0.3px] text-foreground">
						Job Radar
					</h1>
					{data ? (
						<Badge aria-label={`${badgeCount} jobs`}>{badgeCount}</Badge>
					) : loading ? (
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
				{data && !data.isPaid && hasBoard ? (
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
						compact={hasBoard}
					/>
				) : null}

				{!loading && !running && !hasBoard ? (
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

				{hasBoard ? (
					<div className="flex justify-end">
						<JobStatusFilter
							value={statusFilter}
							total={data?.total ?? 0}
							counts={statusCounts}
							busy={loading}
							onChange={changeStatusFilter}
						/>
					</div>
				) : null}

				{loading && (hasBoard || !data) ? (
					<div aria-busy="true">
						<p className="sr-only" role="status">
							Loading jobs
						</p>
						<JobListSkeleton />
					</div>
				) : listedJobs.length > 0 ? (
					<>
					<Accordion
						className="space-y-5"
						value={derivedOpenId ? [derivedOpenId] : []}
						onValueChange={(value) => {
							const nextId = value[0];
							setOpenJobId(typeof nextId === "string" ? nextId : null);
						}}
					>
						{showNewToday ? (
							<section className="space-y-2">
								<h2 className="text-sm font-medium">New today</h2>
								<div className="grid min-w-0 gap-2">
									{newToday.map((job) => (
										<JobCard
											key={`today-${job.id}`}
											job={job}
											onUnlock={() => setProOpen(true)}
											onDismiss={() => void dismissJob(job.id)}
											onStatus={(status) => void setStatus(job.id, status)}
										/>
									))}
								</div>
							</section>
						) : null}

						{mainJobs.length > 0 ? (
							<section className="space-y-2">
								<div className="grid min-w-0 gap-2">
									{mainJobs.map((job) => (
										<JobCard
											key={job.id}
											job={job}
											onUnlock={() => setProOpen(true)}
											onDismiss={() => void dismissJob(job.id)}
											onStatus={(status) => void setStatus(job.id, status)}
										/>
									))}
								</div>
							</section>
						) : null}
					</Accordion>
					{hasMore || loadingMore ? (
						<div
							ref={loadMoreSentinelRef}
							className="pt-1"
							aria-busy={loadingMore || undefined}
						>
							{loadingMore ? (
								<>
									<p className="sr-only" role="status">
										Loading more jobs
									</p>
									<JobListSkeleton count={2} expandedFirst={false} />
								</>
							) : (
								<div className="h-8" aria-hidden />
							)}
						</div>
					) : null}
					</>
				) : hasBoard ? (
					<p className="px-1 py-8 text-center text-sm text-muted-foreground">
						{statusFilter === "all"
							? "No roles in this list."
							: `No ${TRACKER_LABELS[statusFilter].toLowerCase()} roles yet.`}
					</p>
				) : null}

				{data && !data.isPaid && hasBoard ? (
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

function JobListSkeleton({
	count = 6,
	expandedFirst = true,
}: {
	count?: number;
	expandedFirst?: boolean;
}) {
	return (
		<section className="space-y-2" aria-hidden>
			<div className="grid min-w-0 gap-2">
				{Array.from({ length: count }).map((_, i) => (
					<JobCardSkeleton key={i} expanded={expandedFirst && i === 0} />
				))}
			</div>
		</section>
	);
}

function JobCardSkeleton({ expanded = false }: { expanded?: boolean }) {
	return (
		<div className="min-w-0 overflow-hidden rounded-lg border border-border bg-card p-3.5">
			<div className="flex min-w-0 items-start gap-2">
				<div className="min-w-0 flex-1 space-y-2">
					<Skeleton className="h-4 w-3/4" />
					<Skeleton className="h-3 w-2/5" />
				</div>
				<Skeleton className="h-5 w-19 shrink-0 rounded-full" />
			</div>
			<div className="mt-3 flex items-center justify-between gap-2">
				<Skeleton className="h-7 w-28 rounded-full" />
				<div className="-mr-1.5 flex shrink-0 items-center gap-1">
					<Skeleton className="h-8 w-24 rounded-full" />
					<Skeleton className="size-9 rounded-full" />
				</div>
			</div>
			{expanded ? (
				<div className="mt-3 space-y-2 border-t border-border pt-3">
					<Skeleton className="h-3 w-full" />
					<Skeleton className="h-3 w-5/6" />
					<Skeleton className="h-8 w-full" />
				</div>
			) : null}
		</div>
	);
}

function isJobCardControl(target: EventTarget | null) {
	return (
		target instanceof Element &&
		Boolean(
			target.closest(
				"a, button, input, textarea, select, [role='combobox'], [data-slot='dropdown-menu-trigger']",
			),
		)
	);
}

function toggleJobCardAccordion(event: MouseEvent<HTMLElement>) {
	if (isJobCardControl(event.target)) {
		return;
	}
	if (
		event.target instanceof Element &&
		event.target.closest("[data-slot='accordion-panel']")
	) {
		return;
	}
	const trigger = event.currentTarget.querySelector(
		"[data-slot='accordion-trigger']",
	);
	if (!(trigger instanceof HTMLElement)) {
		return;
	}
	if (trigger.contains(event.target as Node)) {
		return;
	}
	trigger.click();
}

function JobCard({
	job,
	onUnlock,
	onDismiss,
	onStatus,
}: {
	job: RadarJobCard;
	onUnlock?: () => void;
	onDismiss?: () => void;
	onStatus?: (status: RadarTrackerStatus) => void;
}) {
	const locked = job.blurred;
	const meta = locked
		? "Company name · Location"
		: [job.company, job.location, job.workplace].filter(Boolean).join(" · ");
	const score = Number.isFinite(job.atsScore) ? Math.round(job.atsScore) : null;
	const scoreBadge = (
		<div
			className={cn(
				"shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-sm font-medium tabular-nums",
				score != null && score >= 75
					? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
					: score != null && score >= 60
						? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
						: "bg-muted text-muted-foreground",
			)}
		>
			{score != null ? `${score}% match` : "—"}
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
		<AccordionItem
			value={job.id}
			className="min-w-0 cursor-pointer overflow-hidden rounded-lg border border-border bg-card p-3.5 transition-colors hover:border-foreground/20"
			onClick={toggleJobCardAccordion}
		>
			<AccordionHeader className="m-0 text-[15px] font-medium leading-snug">
				<AccordionTrigger className="group flex w-full min-w-0 cursor-pointer items-start gap-2 rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
					<div className="min-w-0 flex-1">
						<span className="wrap-break-word block text-[15px] font-medium leading-snug">
							{job.title || "Matching role"}
						</span>
						{meta ? (
							<span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
								{meta}
							</span>
						) : null}
					</div>
					{scoreBadge}
					<ChevronDown
						size={16}
						className="mt-0.5 shrink-0 text-muted-foreground transition-transform duration-150 group-data-panel-open:rotate-180"
					/>
				</AccordionTrigger>
			</AccordionHeader>

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
				<div className="-mr-1.5 flex shrink-0 items-center gap-1">
					<JobStatusSelect
						value={job.trackerStatus}
						onStatus={onStatus}
					/>
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

			<AccordionPanel className="h-(--accordion-panel-height) overflow-hidden transition-[height] duration-150 ease-out data-ending-style:h-0 data-starting-style:h-0">
				<JobCardDetails job={job} />
			</AccordionPanel>
		</AccordionItem>
	);
}

function TrackerStatusIcon({
	status,
}: {
	status: RadarTrackerStatus;
}) {
	const { Icon, weight, className } = TRACKER_STATUS_ICON[status];
	return <Icon size={16} weight={weight} className={cn("size-4", className)} />;
}

function JobStatusFilter({
	value,
	total,
	counts,
	busy,
	onChange,
}: {
	value: StatusFilter;
	total: number;
	counts: Record<RadarTrackerStatus, number>;
	busy?: boolean;
	onChange: (value: StatusFilter) => void;
}) {
	const active = value !== "all";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						type="button"
						variant="secondary"
						size="xs"
						aria-label="Filter by status"
						aria-pressed={active}
						aria-busy={busy || undefined}
						className="gap-1.5 px-2.5 pr-1.5 font-medium text-foreground"
					/>
				}
			>
				{active ? (
					<TrackerStatusIcon status={value} />
				) : (
					<FunnelSimpleIcon size={16} weight="bold" className="size-4" />
				)}
				{active ? TRACKER_LABELS[value] : "Filter"}
				{busy ? (
					<Loader2
						size={12}
						className="size-3 animate-spin text-muted-foreground"
						aria-hidden
					/>
				) : (
					<CaretDownIcon
						size={12}
						weight="bold"
						className="size-3 text-muted-foreground"
					/>
				)}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" sideOffset={6} className="w-56 min-w-56">
				<DropdownMenuGroup>
					<DropdownMenuLabel className="px-2.5 font-normal">
						Filter by status
					</DropdownMenuLabel>
					<DropdownMenuRadioGroup
						value={value}
						onValueChange={(next) => {
							if (next === "all" || isRadarTrackerStatus(next)) {
								onChange(next);
							}
						}}
					>
						<DropdownMenuRadioItem value="all" className="pr-12">
							All
							<span className="ml-auto text-xs tabular-nums text-muted-foreground">
								{total}
							</span>
						</DropdownMenuRadioItem>
						{RADAR_TRACKER_STATUSES.map((status) => (
							<DropdownMenuRadioItem
								key={status}
								value={status}
								className="pr-12"
							>
								<TrackerStatusIcon status={status} />
								{TRACKER_LABELS[status]}
								<span className="ml-auto text-xs tabular-nums text-muted-foreground">
									{counts[status]}
								</span>
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function JobStatusSelect({
	value,
	onStatus,
}: {
	value: RadarTrackerStatus;
	onStatus?: (status: RadarTrackerStatus) => void;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						type="button"
						variant="secondary"
						size="xs"
						aria-label="Application status"
						className="gap-1.5 px-2.5 pr-1.5 font-medium text-foreground"
					/>
				}
			>
				<TrackerStatusIcon status={value} />
				{TRACKER_LABELS[value]}
				<CaretDownIcon
					size={12}
					weight="bold"
					className="size-3 text-muted-foreground"
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" sideOffset={6} className="w-56 min-w-56">
				<DropdownMenuGroup>
					<DropdownMenuLabel className="px-2.5 font-normal">
						Change status
					</DropdownMenuLabel>
					<DropdownMenuRadioGroup
						value={value}
						onValueChange={(next) => {
							if (typeof next === "string" && isRadarTrackerStatus(next)) {
								onStatus?.(next);
							}
						}}
					>
						{RADAR_TRACKER_STATUSES.map((status) => (
							<DropdownMenuRadioItem key={status} value={status}>
								<TrackerStatusIcon status={status} />
								{TRACKER_LABELS[status]}
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function JobCardDetails({ job }: { job: RadarJobCard }) {
	const gapTerms = job.gaps.map((g) => g.term).filter(Boolean);
	const strengthTerms = job.strengths;
	const seniorityFit = parseRadarSeniorityFit(job.seniorityFit);
	const seniorityLabel = RADAR_SENIORITY_FIT_LABELS[seniorityFit];

	return (
		<div className="pt-3">
			{seniorityLabel ? (
				<p className="text-xs text-muted-foreground">{seniorityLabel}</p>
			) : null}

			{job.summary ? (
				<p
					className={cn(
						"text-sm text-foreground/90",
						seniorityLabel ? "mt-2" : null,
					)}
				>
					{job.summary}
				</p>
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

			<div className="mt-4 border-t border-border pt-3">
				<Button
					className="w-full"
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
