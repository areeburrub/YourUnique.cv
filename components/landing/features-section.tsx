"use client";

import {
	CheckIcon,
	DownloadSimpleIcon,
	LayoutIcon,
	LinkedinLogoIcon,
	SwatchesIcon,
	UserIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

function InView({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const [inView, setInView] = useState(false);

	useEffect(() => {
		const node = ref.current;
		if (!node) {
			return;
		}
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry?.isIntersecting) {
					return;
				}
				setInView(true);
				observer.disconnect();
			},
			{ threshold: 0.32 },
		);
		observer.observe(node);
		return () => observer.disconnect();
	}, []);

	return (
		<div ref={ref} className={cn(inView && "is-in", className)}>
			{children}
		</div>
	);
}

function FeatureRow({
	eyebrow,
	title,
	body,
	graphic,
	flip = false,
}: {
	eyebrow: string;
	title: string;
	body: ReactNode;
	graphic: ReactNode;
	flip?: boolean;
}) {
	return (
		<div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
			<div className={cn(flip && "lg:order-2")}>
				<p className="eyebrow !text-brand">{eyebrow}</p>
				<h3 className="font-display mt-3 max-w-[420px] text-[32px] leading-10 font-semibold tracking-[-0.64px] text-foreground sm:text-[36px] sm:leading-[44px]">
					{title}
				</h3>
				<p className="mt-4 max-w-[400px] text-base leading-7 text-muted-foreground">
					{body}
				</p>
			</div>
			<div className={cn(flip && "lg:order-1")}>{graphic}</div>
		</div>
	);
}

function GraphNode({
	className,
	style,
	children,
}: {
	className?: string;
	style: { top: string; left: string };
	children: ReactNode;
}) {
	return (
		<div
			className={cn(
				"feature-fade absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-md border border-border bg-card px-2.5 py-2 shadow-none",
				className,
			)}
			style={style}
		>
			{children}
		</div>
	);
}

function OnboardingGraph() {
	return (
		<InView className="rounded-2xl bg-pastel-blush p-4 sm:p-6">
			<div
				aria-hidden="true"
				className="relative aspect-[5/4] w-full overflow-hidden rounded-xl border border-border bg-card"
			>
				<svg
					className="absolute inset-0 h-full w-full text-border"
					viewBox="0 0 400 320"
					fill="none"
				>
					<path className="feature-line feature-d2" d="M108 58 L200 128" stroke="currentColor" strokeWidth="1.5" />
					<path className="feature-line feature-d2" d="M292 58 L200 128" stroke="currentColor" strokeWidth="1.5" />
					<path className="feature-line feature-d4" d="M200 176 L78 248" stroke="currentColor" strokeWidth="1.5" />
					<path className="feature-line feature-d4" d="M200 176 L200 248" stroke="currentColor" strokeWidth="1.5" />
					<path className="feature-line feature-d4" d="M200 176 L322 248" stroke="currentColor" strokeWidth="1.5" />
				</svg>

				<GraphNode className="feature-d1" style={{ top: "18%", left: "27%" }}>
					<span className="flex size-7 items-center justify-center rounded-sm bg-[#e53935] text-[8px] font-semibold text-white">
						PDF
					</span>
					<span className="text-[12px] font-medium text-foreground">
						Resume
					</span>
				</GraphNode>

				<GraphNode className="feature-d1" style={{ top: "18%", left: "73%" }}>
					<span className="flex size-7 items-center justify-center rounded-sm bg-[#0a66c2] text-white">
						<LinkedinLogoIcon size={14} weight="fill" />
					</span>
					<span className="text-[12px] font-medium text-foreground">
						LinkedIn
					</span>
				</GraphNode>

				<GraphNode
					className="feature-pulse feature-d3 border-brand/20 bg-pastel-blush px-3 py-2.5"
					style={{ top: "48%", left: "50%" }}
				>
					<span className="flex size-7 items-center justify-center rounded-sm bg-brand text-brand-foreground">
						<UserIcon size={14} weight="bold" />
					</span>
					<span className="text-[13px] font-medium text-foreground">
						Your persona
					</span>
				</GraphNode>

				<GraphNode className="feature-d5" style={{ top: "82%", left: "20%" }}>
					<span className="text-[12px] text-muted-foreground">Roles</span>
				</GraphNode>
				<GraphNode className="feature-d5" style={{ top: "82%", left: "50%" }}>
					<span className="text-[12px] text-muted-foreground">Skills</span>
				</GraphNode>
				<GraphNode className="feature-d5" style={{ top: "82%", left: "80%" }}>
					<span className="text-[12px] text-muted-foreground">Wins</span>
				</GraphNode>
			</div>
		</InView>
	);
}

function Spine({ className }: { className?: string }) {
	return (
		<svg
			className="h-9 w-4 text-border"
			viewBox="0 0 16 36"
			fill="none"
			aria-hidden
		>
			<path
				className={cn("feature-line", className)}
				d="M8 0 V36"
				stroke="currentColor"
				strokeWidth="1.5"
			/>
		</svg>
	);
}

function FileChip({
	name,
	className,
}: {
	name: string;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex w-full items-center gap-2 rounded-md bg-secondary py-1.5 pr-3 pl-1.5",
				className,
			)}
		>
			<span className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-[#e53935] text-[8px] font-semibold text-white">
				PDF
			</span>
			<span className="truncate text-[12px] font-medium text-foreground">
				{name}
			</span>
		</div>
	);
}

const LIBRARY_TEMPLATES = ["Classic", "Serif", "Plain"] as const;

function LibraryCycle() {
	const [index, setIndex] = useState(0);

	useEffect(() => {
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
		if (reduce.matches) {
			return;
		}
		const timer = window.setInterval(() => {
			setIndex((current) => (current + 1) % LIBRARY_TEMPLATES.length);
		}, 2000);
		return () => window.clearInterval(timer);
	}, []);

	return (
		<div className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2">
			<span className="flex size-7 items-center justify-center rounded-sm bg-muted text-muted-foreground">
				<LayoutIcon size={14} weight="bold" />
			</span>
			<div className="relative h-8 w-[4.25rem] overflow-hidden">
				{LIBRARY_TEMPLATES.map((name, itemIndex) => (
					<span
						key={name}
						className={cn(
							"absolute inset-0 flex flex-col justify-center text-[12px] font-medium text-foreground transition-all duration-300 ease-out",
							itemIndex === index
								? "translate-x-0 opacity-100"
								: itemIndex === (index + 1) % LIBRARY_TEMPLATES.length
									? "translate-x-6 opacity-0"
									: "-translate-x-6 opacity-0",
						)}
					>
						{name}
					</span>
				))}
			</div>
		</div>
	);
}

function TemplateGraphic() {
	return (
		<InView className="rounded-2xl bg-pastel-sage p-4 sm:p-6">
			<div
				aria-hidden="true"
				className="flex flex-col items-center rounded-xl border border-border bg-card px-5 py-6"
			>
				<div className="feature-fade feature-d1 w-[15.5rem]">
					<FileChip name="Alex_Rivera_Resume.pdf" />
				</div>

				<Spine className="feature-d2" />

				<div className="feature-fade feature-d3 flex flex-wrap items-center justify-center gap-2">
					<div className="feature-pulse flex items-center gap-2 rounded-md border border-brand/20 bg-pastel-sage px-3 py-2">
						<span className="flex size-7 items-center justify-center rounded-sm bg-brand text-brand-foreground">
							<SwatchesIcon size={14} weight="bold" />
						</span>
						<span className="flex flex-col gap-1">
							<span className="text-[12px] font-medium text-foreground">
								Alex&apos;s design
							</span>
							<span className="flex gap-1">
								<span className="size-1.5 rounded-full bg-brand" />
								<span className="size-1.5 rounded-full bg-foreground/70" />
								<span className="size-1.5 rounded-full bg-border" />
							</span>
						</span>
					</div>
					<span className="text-[11px] text-muted-soft">or</span>
					<LibraryCycle />
				</div>

				<Spine className="feature-d4" />

				<div className="flex w-[15.5rem] flex-col gap-1.5">
					<FileChip
						className="feature-fade feature-d5"
						name="Product Engineer - Northline.pdf"
					/>
					<FileChip
						className="feature-fade feature-d6"
						name="Platform Lead - Orbit.pdf"
					/>
					<FileChip
						className="feature-fade feature-d6"
						name="Staff Engineer - Fieldnote.pdf"
					/>
				</div>
			</div>
		</InView>
	);
}

function ChatGraphic() {
	return (
		<InView className="rounded-2xl bg-pastel-butter p-4 sm:p-6">
			<div
				aria-hidden="true"
				className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
			>
				<div className="feature-fade feature-d1 ml-auto flex w-fit max-w-[16rem] flex-col items-end gap-1">
					<div className="inline-flex items-center gap-2 rounded-md bg-secondary py-1.5 pr-2.5 pl-2">
						<span className="flex size-7 items-center justify-center rounded-sm bg-[#0a66c2] text-white">
							<LinkedinLogoIcon size={13} weight="fill" />
						</span>
						<span className="text-[12px] text-foreground">
							linkedin.com/jobs/view/4128
						</span>
					</div>
					<div className="rounded-md bg-secondary px-3 py-2 text-[13px] leading-5 text-foreground">
						Tailor my resume for this
					</div>
				</div>

				<div className="feature-fade feature-d3 inline-flex w-fit max-w-[16rem] items-center gap-2 rounded-md bg-secondary py-1.5 pr-1.5 pl-2">
					<span className="flex size-8 items-center justify-center rounded-md bg-[#e53935] text-[8px] font-semibold text-white">
						PDF
					</span>
					<span className="flex min-w-0 flex-col gap-0.5">
						<span className="truncate text-[13px] font-medium text-foreground">
							Product Engineer - Northline.pdf
						</span>
						<span className="text-[11px] text-muted-foreground">PDF ready</span>
					</span>
					<span className="flex size-7 items-center justify-center text-muted-foreground">
						<DownloadSimpleIcon size={14} weight="bold" />
					</span>
				</div>

				<div className="feature-fade feature-d5 ml-auto w-fit max-w-[16rem] rounded-md bg-secondary px-3 py-2 text-[13px] leading-5 text-foreground">
					I just got AWS Cloud. Update my profile.
				</div>

				<div className="feature-fade feature-d6 inline-flex w-fit items-center gap-2.5 rounded-md bg-secondary py-1.5 pr-3 pl-2">
					<span className="flex size-8 items-center justify-center rounded-md bg-pastel-sage text-[#2f6b4a]">
						<CheckIcon size={14} weight="bold" />
					</span>
					<span className="flex flex-col gap-0.5">
						<span className="text-[13px] font-medium text-foreground">
							Updated your profile
						</span>
						<span className="text-[11px] text-muted-foreground">
							AWS Cloud · Certifications
						</span>
					</span>
				</div>
			</div>
		</InView>
	);
}

const ATS_ROWS = [
	{ area: "TypeScript / React", match: "9/10" },
	{ area: "GraphQL", match: "8/10" },
	{ area: "Platform ownership", match: "8/10" },
	{ area: "Staff-level scope", match: "6/10" },
	{ area: "JD keyword alignment", match: "76/100" },
] as const;

const ATS_GAPS = ["Kubernetes", "SOC 2 reviews", "multi-team staffing"] as const;

function AtsGraphic() {
	return (
		<InView className="rounded-2xl bg-pastel-lilac p-4 sm:p-6">
			<div
				aria-hidden="true"
				className="rounded-xl border border-border bg-card p-4 sm:p-5"
			>
				<div className="feature-fade feature-d1 flex items-baseline justify-between gap-3">
					<div className="min-w-0">
						<p className="text-[13px] font-medium text-foreground">
							ATS Analysis
						</p>
						<p className="truncate text-[12px] text-muted-foreground">
							Product Engineer at Northline
						</p>
					</div>
					<p className="shrink-0 text-[15px] font-semibold text-brand">
						84/100
					</p>
				</div>

				<table className="feature-fade feature-d2 mt-3 w-full text-[12px] leading-4">
					<thead>
						<tr className="text-muted-soft">
							<th className="pb-1.5 text-left font-medium">Area</th>
							<th className="pb-1.5 text-right font-medium">Match</th>
						</tr>
					</thead>
					<tbody>
						{ATS_ROWS.map((row) => (
							<tr key={row.area} className="border-t border-border">
								<td className="py-1.5 text-foreground">{row.area}</td>
								<td className="py-1.5 text-right tabular-nums text-foreground">
									{row.match}
								</td>
							</tr>
						))}
					</tbody>
				</table>

				<div className="feature-fade feature-d4 mt-3 rounded-md bg-pastel-blush px-3 py-2.5">
					<p className="text-[12px] font-medium text-foreground">
						Biggest gaps
					</p>
					<ul className="mt-1.5 space-y-1">
						{ATS_GAPS.map((gap) => (
							<li
								key={gap}
								className="flex items-center gap-2 text-[12px] leading-4 text-foreground"
							>
								<span
									aria-hidden
									className="size-1 shrink-0 rounded-full bg-brand"
								/>
								{gap}
							</li>
						))}
					</ul>
				</div>
			</div>
		</InView>
	);
}

export function FeaturesSection() {
	return (
		<section id="how-it-works">
			<div className="rail px-5 py-20 sm:px-8 md:px-10 md:py-28">
				<div className="mx-auto text-center">
					<p className="eyebrow !text-brand">How it works</p>
					<h2 className="font-display mt-4 text-[40px] leading-[48px] font-semibold tracking-[-0.8px] text-foreground sm:whitespace-nowrap sm:text-[48px] sm:leading-[56px] sm:tracking-[-0.96px]">
						From your files to a CV for this job
					</h2>
				</div>

				<div className="mt-16 flex flex-col gap-20 md:gap-28">
					<FeatureRow
						eyebrow="01 · Onboarding"
						title="We start with your resume and LinkedIn"
						body="Upload a current CV and, if you want, a profile URL. We pull roles, skills, and wins into one persona the agent can write from."
						graphic={<OnboardingGraph />}
					/>
					<FeatureRow
						eyebrow="02 · Your layout"
						title="Bring your own template"
						body={
							<>
								We extract the look of the resume you uploaded,
								so new drafts can stay in your design. Or pick
								one of the{" "}
								<Link
									href="/templates"
									className="font-medium text-brand underline-offset-4 hover:underline"
								>
									built-in templates
								</Link>
								.
							</>
						}
						graphic={<TemplateGraphic />}
						flip
					/>
					<FeatureRow
						eyebrow="03 · Chat"
						title="Send a JD, ask a question, or mention something new"
						body="The agent writes a CV for that role. If you tell it about a cert, a job, or a win, it updates your profile and uses it next time."
						graphic={<ChatGraphic />}
					/>
					<FeatureRow
						eyebrow="04 · ATS"
						title="See the match and the gaps"
						body="We write the optimized draft from your profile first. The ATS read then shows the score, the area table, and requirements you don't have yet. Those are the real gaps."
						graphic={<AtsGraphic />}
						flip
					/>
				</div>
			</div>
		</section>
	);
}
