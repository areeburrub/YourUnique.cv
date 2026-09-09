"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button";

export function JobRadarProHeader({ onUpgrade }: { onUpgrade: () => void }) {
	return (
		<section className="relative min-h-50 overflow-hidden rounded-lg sm:min-h-60">
			<Image
				src="/assets/radar/pro-header-v4.webp"
				alt=""
				fill
				priority
				sizes="(max-width: 1152px) 100vw, 1152px"
				className="object-cover object-[center_35%]"
			/>
			<div
				aria-hidden
				className="absolute inset-0 bg-linear-to-r from-black/75 via-black/40 to-black/15"
			/>
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay"
				style={{
					backgroundImage:
						"url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.9'/></svg>\")",
				}}
			/>
			<div className="relative z-10 flex min-h-50 flex-col justify-end gap-3 px-5 py-6 sm:min-h-60 sm:px-7 sm:py-8">
				<h2 className="font-display text-[26px] leading-8 font-medium tracking-[-0.4px] text-white sm:text-[32px] sm:leading-10">
					Pro scans 200+ new roles a day
				</h2>
				<p className="max-w-md text-sm leading-6 text-white/80">
					We match your profile every day and alert you the moment a
					strong role goes live.
				</p>
				<div>
					<Button
						type="button"
						onClick={onUpgrade}
						className="bg-white text-zinc-950 hover:bg-white/90"
					>
						Upgrade to Pro
					</Button>
				</div>
			</div>
		</section>
	);
}
