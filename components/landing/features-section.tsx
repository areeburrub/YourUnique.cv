import { FileText } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";

function StackedFrame({ children }: { children: ReactNode }) {
	return (
		<div className="relative mt-auto pt-10 pb-3">
			<div
				aria-hidden="true"
				className="absolute inset-x-4 top-[52px] bottom-0 rounded-[14px] border border-border bg-muted"
			/>
			<div
				aria-hidden="true"
				className="absolute inset-x-2 top-[44px] bottom-1 rounded-[14px] border border-border bg-background"
			/>
			<div className="relative flex h-full min-h-[280px] flex-col overflow-hidden rounded-[14px] border border-border bg-background shadow-[0_15px_50px_#2f2f2f1a] dark:shadow-[0_15px_50px_#00000055]">
				{children}
			</div>
		</div>
	);
}

function ResumeListMock() {
	const resumes = [
		{
			role: "Product Engineer",
			company: "Northline",
			updated: "Today",
			avatarTone: "bg-[#e8f1ff] text-brand",
			initials: "NL",
		},
		{
			role: "Platform Lead",
			company: "Orbit Systems",
			updated: "3d ago",
			avatarTone: "bg-[#fdeee0] text-[#c56a12]",
			initials: "OS",
		},
		{
			role: "Staff Engineer",
			company: "Fieldnote",
			updated: "Last week",
			avatarTone: "bg-[#efeaff] text-[#5b3fd6]",
			initials: "FN",
		},
		{
			role: "Growth PM",
			company: "Riverbed",
			updated: "2wk ago",
			avatarTone: "bg-[#e9f8ef] text-[#1f9d55]",
			initials: "RB",
		},
	];

	return (
		<StackedFrame>
			<div className="flex items-center justify-between border-b border-border px-4 py-2.5">
				<p className="text-[13px] font-medium text-foreground">
					Your tailored resumes
				</p>
				<span className="rounded-[6px] border border-border px-2 py-0.5 text-[12px] text-muted-foreground">
					View all
				</span>
			</div>
			<div className="flex flex-col divide-y divide-border px-4">
				{resumes.map((resume) => (
					<div
						key={resume.company}
						className="flex items-center gap-2.5 py-2.5"
					>
						<span className="flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-surface-subtle text-muted-foreground">
							<FileText size={14} weight="bold" />
						</span>
						<div className="min-w-0 flex-1">
							<p className="truncate text-[13px] font-medium text-foreground">
								{resume.role}
							</p>
							<p className="truncate text-[12px] text-muted-foreground">
								{resume.company} · {resume.updated}
							</p>
						</div>
						<span
							className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${resume.avatarTone}`}
						>
							{resume.initials}
						</span>
					</div>
				))}
			</div>
		</StackedFrame>
	);
}

function AtsScoreGauge({ score = 90 }: { score?: number }) {
	const width = 220;
	const height = 130;
	const cx = width / 2;
	const cy = 118;
	const radius = 92;
	const stroke = 16;

	// s: 0 → left end, 0.5 → top, 1 → right end. Traces only the upper semicircle.
	const pointAt = (s: number) => ({
		x: cx - radius * Math.cos(Math.PI * s),
		y: cy - radius * Math.sin(Math.PI * s),
	});

	const start = pointAt(0);
	const end = pointAt(1);
	const trackPath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;

	const t = Math.min(Math.max(score / 100, 0), 1);
	const tip = pointAt(t);
	const progressPath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${tip.x} ${tip.y}`;

	return (
		<div
			className="relative mx-auto"
			style={{ width, height }}
			aria-label={`ATS match score ${score}%`}
		>
			<svg width={width} height={height} aria-hidden="true">
				<path
					d={trackPath}
					fill="none"
					stroke="#ececf0"
					strokeWidth={stroke}
					strokeLinecap="round"
				/>
				<path
					d={progressPath}
					fill="none"
					stroke="#025bff"
					strokeWidth={stroke}
					strokeLinecap="round"
				/>
				<circle
					cx={tip.x}
					cy={tip.y}
					r={7}
					fill="#3dd68c"
					stroke="#fff"
					strokeWidth={2.5}
					style={{ filter: "drop-shadow(0 1px 3px rgba(61,214,140,0.5))" }}
				/>
			</svg>
			<div className="absolute inset-x-0 bottom-1 flex flex-col items-center text-center">
				<p className="font-display text-[38px] leading-none font-semibold tracking-[-1px] text-foreground">
					{score}%
				</p>
				<p className="mt-2 text-[12px] leading-4 text-muted-foreground">
					Keywords matched{" "}
					<span className="font-medium text-foreground">18/20</span>
				</p>
			</div>
		</div>
	);
}

function AtsScoreMock() {
	return (
		<StackedFrame>
			<div className="flex items-center justify-between px-5 pt-5">
				<p className="text-[15px] font-medium text-foreground">
					ATS match score
				</p>
				<span className="inline-flex items-center gap-1 rounded-[8px] border border-border px-2.5 py-1 text-[12px] text-muted-foreground">
					Report
					<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
						<path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</span>
			</div>
			<div className="flex flex-1 items-center justify-center px-4 py-6">
				<AtsScoreGauge score={90} />
			</div>
		</StackedFrame>
	);
}

export function FeaturesSection() {
	return (
		<section id="features" className="border-b border-border">
			<div className="rail px-4 py-20 sm:px-8 md:px-10 md:py-28">
				<div className="mx-auto max-w-[520px] text-center">
					<h2 className="font-display text-[40px] leading-[48px] font-semibold tracking-[-0.8px] text-foreground sm:text-[48px] sm:leading-[56px] sm:tracking-[-0.96px]">
						Write for the job in front of you
					</h2>
				</div>

				<div className="mt-14 grid md:grid-cols-2">
					<article className="flex flex-col border-border md:border-r md:pr-8 lg:pr-10">
						<h3 className="text-[20px] leading-7 font-semibold tracking-[-0.2px] text-foreground">
							Every job asks for a different you
						</h3>
						<p className="mt-3 max-w-[482px] text-base leading-6 text-muted-foreground">
							The same career can read as platform-heavy or
							product-minded. Paste the posting. The agent
							reweights your story for that brief.
						</p>
						<ResumeListMock />
					</article>

					<article className="mt-12 flex flex-col border-t border-border pt-12 md:mt-0 md:border-t-0 md:pt-0 md:pl-8 lg:pl-10">
						<h3 className="text-[20px] leading-7 font-semibold tracking-[-0.2px] text-foreground">
							See the ATS fit before you send
						</h3>
						<p className="mt-3 max-w-[420px] text-base leading-6 text-muted-foreground">
							Each tailored draft gets a clear match score for the
							role, so you know how the resume reads to scanners
							and humans.
						</p>
						<AtsScoreMock />
					</article>
				</div>
			</div>
		</section>
	);
}
