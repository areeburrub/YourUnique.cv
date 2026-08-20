"use client";

import { CheckIcon } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import { Streamdown } from "streamdown";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type GenerateStage = "analyzing" | "linkedin" | "writing" | "done";

type StageItem = {
	id: GenerateStage;
	label: string;
	visible: boolean;
};

type OnboardingGenerateStepProps = {
	generateStage: GenerateStage;
	hasResume: boolean;
	hasLinkedIn: boolean;
	profilePreview: string;
};

const EXPECTED_MS = 50_000;
const MAX_INDETERMINATE = 0.92;

function stageFloor(stage: GenerateStage, previewLength: number) {
	if (stage === "done") {
		return 1;
	}
	if (stage === "writing") {
		return Math.min(0.9, 0.48 + Math.min(0.4, (previewLength / 2400) * 0.4));
	}
	if (stage === "linkedin") {
		return 0.24;
	}
	return 0.08;
}

function formatEta(remainingMs: number, done: boolean) {
	if (done) {
		return "Done";
	}
	if (remainingMs <= 0) {
		return "Almost done";
	}
	const seconds = Math.max(1, Math.ceil(remainingMs / 1000));
	return seconds === 1
		? "About 1 second left"
		: `About ${seconds} seconds left`;
}

export function OnboardingGenerateStep({
	generateStage,
	hasResume,
	hasLinkedIn,
	profilePreview,
}: OnboardingGenerateStepProps) {
	const scrollerRef = useRef<HTMLDivElement>(null);
	const barRef = useRef<HTMLDivElement>(null);
	const etaRef = useRef<HTMLSpanElement>(null);
	const startedAtRef = useRef(Date.now());
	const stageRef = useRef(generateStage);
	const previewLenRef = useRef(profilePreview.length);
	const etaTextRef = useRef("");
	stageRef.current = generateStage;
	previewLenRef.current = profilePreview.length;

	const stages: StageItem[] = [
		{ id: "analyzing", label: "Analyzing resume…", visible: hasResume },
		{
			id: "linkedin",
			label: "Checking LinkedIn…",
			visible: hasLinkedIn,
		},
		{ id: "writing", label: "Writing your profile…", visible: true },
	];
	const order: GenerateStage[] = ["analyzing", "linkedin", "writing", "done"];
	const activeIndex = order.indexOf(generateStage);
	const done = generateStage === "done";

	useEffect(() => {
		const node = scrollerRef.current;
		if (!node) {
			return;
		}
		node.scrollTop = node.scrollHeight;
	}, [profilePreview]);

	useEffect(() => {
		const prefersReduced = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		let frame = 0;

		const apply = (value: number, label: string, complete = false) => {
			const bar = barRef.current;
			if (bar) {
				if (complete) {
					bar.style.transition = "transform 300ms ease-out";
				}
				bar.style.transform = `scaleX(${value})`;
				bar.setAttribute("aria-valuenow", String(Math.round(value * 100)));
			}
			if (etaRef.current && etaTextRef.current !== label) {
				etaTextRef.current = label;
				etaRef.current.textContent = label;
			}
		};

		const tick = () => {
			const stage = stageRef.current;
			const elapsed = Date.now() - startedAtRef.current;
			if (stage === "done") {
				apply(1, formatEta(0, true), true);
				return;
			}
			const t = Math.min(elapsed / EXPECTED_MS, 1);
			const eased = prefersReduced ? t : 1 - (1 - t) ** 2;
			const timed = 0.08 + eased * 0.84;
			const progress = Math.min(
				MAX_INDETERMINATE,
				Math.max(stageFloor(stage, previewLenRef.current), timed),
			);
			apply(progress, formatEta(EXPECTED_MS - elapsed, false));
			frame = requestAnimationFrame(tick);
		};

		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	}, []);

	return (
		<div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10 sm:px-6 sm:py-14">
			<div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-border/60">
				<div
					ref={barRef}
					role="progressbar"
					aria-label="Profile generation progress"
					aria-valuemin={0}
					aria-valuemax={100}
					aria-valuenow={8}
					className="h-full w-full origin-left scale-x-[0.08] bg-brand will-change-transform"
				/>
			</div>

			<div className="mb-8 max-w-lg">
				<h1 className="font-display text-3xl font-semibold tracking-[-0.6px] sm:text-4xl sm:tracking-[-0.8px]">
					Building your profile
				</h1>
				<p className="mt-3 text-base leading-6 text-muted-foreground">
					Hang tight. This usually takes under a minute.
				</p>
				<p
					aria-hidden
					className="mt-1 text-sm text-foreground/80"
				>
					<span ref={etaRef}>About 50 seconds left</span>
				</p>
			</div>

			<div className="relative min-h-72 flex-1 overflow-hidden rounded-2xl border border-border bg-card">
				<div
					ref={scrollerRef}
					aria-hidden
					className="pointer-events-none absolute inset-0 overflow-hidden p-6 opacity-[0.18] select-none sm:left-[42%] sm:p-8"
				>
					{profilePreview.trim() ? (
						<div className="text-[11px] leading-4 [&_a]:text-inherit [&_h1]:mb-1.5 [&_h1]:text-[13px] [&_h1]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_h2]:text-[12px] [&_h2]:font-semibold [&_h3]:mt-2.5 [&_h3]:mb-1 [&_h3]:text-[11px] [&_h3]:font-medium [&_li]:my-0.5 [&_ol]:my-1.5 [&_ol]:pl-4 [&_p]:my-1.5 [&_ul]:my-1.5 [&_ul]:pl-4">
							<Streamdown className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
								{profilePreview}
							</Streamdown>
						</div>
					) : (
						<div className="flex flex-col gap-1.5 pt-1">
							<div className="h-2 w-24 rounded-full bg-foreground/40" />
							<div className="h-1.5 w-full rounded-full bg-foreground/25" />
							<div className="h-1.5 w-11/12 rounded-full bg-foreground/25" />
							<div className="h-1.5 w-4/5 rounded-full bg-foreground/25" />
							<div className="mt-2 h-1.5 w-full rounded-full bg-foreground/25" />
							<div className="h-1.5 w-5/6 rounded-full bg-foreground/25" />
							<div className="h-1.5 w-2/3 rounded-full bg-foreground/25" />
						</div>
					)}
				</div>

				<ul className="relative z-10 flex flex-col gap-3 p-6 sm:max-w-[42%] sm:py-8">
					{stages
						.filter((stage) => stage.visible)
						.map((stage) => {
							const stageIndex = order.indexOf(stage.id);
							const stageDone = done || stageIndex < activeIndex;
							const active = !done && stageIndex === activeIndex;
							return (
								<li
									key={stage.id}
									className={cn(
										"flex items-center gap-3 text-sm",
										stageDone || active
											? "text-foreground"
											: "text-muted-foreground",
									)}
								>
									<span
										className={cn(
											"flex size-7 items-center justify-center rounded-full border",
											stageDone
												? "border-brand/40 bg-brand/10 text-brand"
												: active
													? "border-border bg-surface-subtle"
													: "border-border",
										)}
									>
										{stageDone ? (
											<CheckIcon size={14} weight="bold" />
										) : active ? (
											<Spinner className="size-3.5" />
										) : (
											<span className="size-1.5 rounded-full bg-muted-foreground/40" />
										)}
									</span>
									{stage.label}
								</li>
							);
						})}
				</ul>
			</div>
		</div>
	);
}
