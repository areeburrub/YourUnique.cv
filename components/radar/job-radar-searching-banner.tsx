"use client";

import Image from "next/image";

import { RadarSignalIcon } from "@/components/radar/radar-active-badge";

const GRAIN =
	"url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.9'/></svg>\")";

export function JobRadarSearchingBanner({
	isPaid,
	compact = false,
}: {
	isPaid: boolean;
	compact?: boolean;
}) {
	if (compact) {
		return (
			<div className="flex items-center gap-3 overflow-hidden rounded-lg border border-border bg-card px-3 py-2.5">
				<RadarSignalIcon className="size-4 shrink-0 text-brand" />
				<div className="min-w-0">
					<p className="text-sm font-medium text-foreground">Scoring more roles</p>
					<p className="text-xs text-muted-foreground">
						New matches will drop into the list as they land. You can keep browsing.
					</p>
				</div>
			</div>
		);
	}

	return (
		<section className="relative min-h-44 overflow-hidden rounded-lg sm:min-h-56">
			<Image
				src="/assets/radar/searching.webp"
				alt=""
				fill
				priority
				sizes="(max-width: 1152px) 100vw, 1152px"
				className="object-cover object-[center_40%]"
			/>
			<div
				aria-hidden
				className="absolute inset-0 bg-linear-to-r from-black/80 via-black/50 to-black/20"
			/>
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay"
				style={{ backgroundImage: GRAIN }}
			/>
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 overflow-hidden"
			>
				<div
					className="animate-radar-search-scan absolute inset-y-0 left-0 w-[200%] bg-[linear-gradient(90deg,transparent_0%,transparent_12%,rgba(253,230,138,0.22)_25%,transparent_38%,transparent_62%,rgba(253,230,138,0.22)_75%,transparent_88%,transparent_100%)]"
				/>
			</div>
			<div className="relative z-10 flex min-h-44 flex-col justify-end gap-2 px-5 py-5 sm:min-h-56 sm:px-7 sm:py-7">
				<p className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.14em] text-amber-200/90 uppercase">
					<RadarSignalIcon className="size-3.5 text-amber-200" />
					Scanning
				</p>
				<h2 className="font-display text-[26px] leading-8 font-medium tracking-[-0.4px] text-white sm:text-[32px] sm:leading-10">
					Searching roles for you
				</h2>
				<p className="max-w-md text-sm leading-6 text-white/80">
					{isPaid
						? "First matches usually show up in a couple of minutes. More keep landing as we score — you can leave this page."
						: "This scores 10 roles. First matches usually show up in a couple of minutes."}
				</p>
			</div>
		</section>
	);
}
