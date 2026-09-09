"use client";

import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

export function RadarSignalIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden
			className={cn("size-4", className)}
		>
			<circle
				cx="12"
				cy="12"
				r="10"
				stroke="currentColor"
				strokeWidth="1.15"
				className="opacity-25"
			/>
			<circle
				cx="12"
				cy="12"
				r="6.5"
				stroke="currentColor"
				strokeWidth="1"
				className="opacity-35"
			/>
			<g
				className="origin-center motion-reduce:animate-none animate-[spin_2.4s_linear_infinite]"
				style={{ transformBox: "view-box", transformOrigin: "center" }}
			>
				<path
					d="M12 12 L12 2 A10 10 0 0 1 19.6 9.2 Z"
					fill="currentColor"
					className="opacity-40"
				/>
			</g>
			<circle cx="12" cy="12" r="1.7" fill="currentColor" />
			<circle
				cx="18.2"
				cy="6.6"
				r="1.35"
				fill="currentColor"
				className="motion-reduce:animate-none animate-pulse"
			/>
		</svg>
	);
}

export function RadarActiveBadge() {
	return (
		<HoverCard>
			<HoverCardTrigger
				type="button"
				className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground"
				aria-label="Radar is active. Latest jobs will appear here."
			>
				<RadarSignalIcon className="text-brand" />
				<span className="hidden sm:inline">Radar active</span>
			</HoverCardTrigger>
			<HoverCardContent className="w-52" side="bottom" align="end">
				<p className="font-medium">Radar is active</p>
				<p className="mt-0.5 text-muted-foreground">
					Latest jobs will appear here.
				</p>
			</HoverCardContent>
		</HoverCard>
	);
}
