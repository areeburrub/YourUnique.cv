"use client";

import { SatelliteDish } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function RadarOpenCard({
	reason = "Review matches on Job Radar",
}: {
	reason?: string;
}) {
	return (
		<div className="flex w-full max-w-[min(100%,28rem)] items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3">
			<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-pastel-blush text-brand">
				<SatelliteDish size={18} />
			</span>
			<div className="min-w-0 flex-1">
				<p className="text-sm font-medium leading-snug">{reason}</p>
				<p className="mt-0.5 text-xs text-muted-foreground">
					Open the board to read the full shortlist.
				</p>
			</div>
			<Button
				size="sm"
				className="shrink-0"
				nativeButton={false}
				render={<Link href="/job-radar" />}
			>
				Open Radar
			</Button>
		</div>
	);
}
