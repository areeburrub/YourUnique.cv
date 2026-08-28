"use client";

import { formatDailyResetAt, usagePercent } from "@/lib/usage-status";

export function UsageBar({
	label,
	used,
	limit,
	resetAt,
	resetPrefix = "Resets",
}: {
	label: string;
	used: number;
	limit: number;
	resetAt?: string | null;
	resetPrefix?: string;
}) {
	const pct = usagePercent(used, limit);
	const resetLabel =
		limit > 0 && resetAt ? formatDailyResetAt(new Date(resetAt)) : null;

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between gap-3 text-sm">
				<span className="text-muted-foreground">{label}</span>
				<span className="font-medium text-foreground">{pct}%</span>
			</div>
			<div className="h-2 overflow-hidden rounded-full bg-muted">
				<div
					className="h-full rounded-full bg-brand transition-[width]"
					style={{ width: `${pct}%` }}
				/>
			</div>
			{resetLabel ? (
				<p className="text-xs text-muted-soft">
					{resetPrefix} {resetLabel}
				</p>
			) : null}
		</div>
	);
}
