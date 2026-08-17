"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const DURATION_MS = 2 * 60 * 1000;
const SIZE = 72;
const STROKE = 4;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatRemaining(ms: number) {
	const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function GenerationCountdown({
	startedAt,
	onLightSurface = false,
}: {
	startedAt?: string | null;
	/** Set when the surface behind this stays white/paper-colored in both themes. */
	onLightSurface?: boolean;
}) {
	const fallbackStart = useRef(Date.now());
	const startMs = startedAt ? Date.parse(startedAt) : Number.NaN;
	const started = Number.isFinite(startMs) ? startMs : fallbackStart.current;
	const [now, setNow] = useState(() => Date.now());
	const elapsedMs = Math.max(0, now - started);
	const remainingMs = Math.max(0, DURATION_MS - elapsedMs);
	const progress = Math.min(1, elapsedMs / DURATION_MS);
	const finished = remainingMs <= 0;

	useEffect(() => {
		const timer = window.setInterval(() => {
			setNow(Date.now());
		}, 200);
		return () => window.clearInterval(timer);
	}, []);

	const dashOffset = CIRCUMFERENCE * (1 - progress);

	return (
		<div className="flex flex-col items-center text-center">
			<p
				className={cn(
					"text-xs font-medium",
					onLightSurface ? "text-zinc-800" : "text-foreground",
				)}
			>
				{finished ? "Finishing up…" : "Generating…"}
			</p>
			<div
				className="relative mt-2 flex items-center justify-center"
				style={{ width: SIZE, height: SIZE }}
			>
				<svg
					width={SIZE}
					height={SIZE}
					viewBox={`0 0 ${SIZE} ${SIZE}`}
					className="-rotate-90"
				>
					<circle
						cx={SIZE / 2}
						cy={SIZE / 2}
						r={RADIUS}
						fill="none"
						strokeWidth={STROKE}
						className="stroke-brand/15"
					/>
					<circle
						cx={SIZE / 2}
						cy={SIZE / 2}
						r={RADIUS}
						fill="none"
						strokeWidth={STROKE}
						strokeLinecap="round"
						className={
							finished
								? "stroke-brand/40"
								: "stroke-brand transition-[stroke-dashoffset] duration-200 ease-linear"
						}
						strokeDasharray={CIRCUMFERENCE}
						strokeDashoffset={dashOffset}
					/>
				</svg>
				{!finished && progress > 0.01 ? (
					<span
						className="absolute top-1/2 left-1/2 size-1.5 rounded-full bg-brand"
						style={{
							transform: `translate(-50%, -50%) rotate(${progress * 360}deg) translateY(-${RADIUS}px)`,
							boxShadow: `0 0 0 2px ${onLightSurface ? "#fff" : "var(--card)"}`,
						}}
					/>
				) : null}
				<div className="absolute flex flex-col items-center">
					<p
						className={cn(
							"font-display text-[15px] leading-none font-semibold tracking-[-0.3px] tabular-nums",
							onLightSurface ? "text-zinc-900" : "text-foreground",
						)}
					>
						{formatRemaining(remainingMs)}
					</p>
				</div>
			</div>
			<p
				className={cn(
					"mt-2 text-[11px]",
					onLightSurface ? "text-zinc-500" : "text-muted-foreground",
				)}
			>
				Usually takes 1–2 min
			</p>
		</div>
	);
}
