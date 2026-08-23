"use client";

import { formatDailyResetAt } from "@/lib/usage-status";

function usagePercent(used: number, limit: number) {
	if (!(limit > 0)) {
		return used > 0 ? 100 : 0;
	}
	return Math.min(100, Math.round((used / limit) * 100));
}

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
