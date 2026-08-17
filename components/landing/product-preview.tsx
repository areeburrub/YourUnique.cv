"use client";

import { CheckIcon, CircleNotchIcon, DownloadSimpleIcon } from "@phosphor-icons/react";
import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const USER_AT = 0;
const TOOLS_AT = 700;
const TOOL_STAGGER = 700;
const TICK_MS = 160;

type UserShare =
	| { kind: "linkedin"; href: string; text: string }
	| { kind: "pdf"; fileName: string; text: string }
	| { kind: "jd"; text: string }
	| { kind: "question"; text: string };

type AtsScene = {
	role: string;
	company: string;
	score: number;
	rows: Array<{ area: string; match: string }>;
	gaps: string[];
};

type Scene = {
	id: string;
	user: UserShare;
	tools: string[];
	pdf?: string;
	ats?: AtsScene;
	profile?: { title: string; detail: string };
	reply?: string;
};

const SCENES: Scene[] = [
	{
		id: "linkedin",
		user: {
			kind: "linkedin",
			href: "linkedin.com/jobs/view/4128876101",
			text: "Tailor my resume for this",
		},
		tools: [
			"Fetching the job posting",
			"Reading your profile",
			"Creating your resume",
		],
		pdf: "Product Engineer - Northline.pdf",
		ats: {
			role: "Product Engineer",
			company: "Northline",
			score: 84,
			rows: [
				{ area: "TypeScript / React", match: "9/10" },
				{ area: "GraphQL", match: "8/10" },
				{ area: "Platform ownership", match: "8/10" },
				{ area: "Staff-level scope", match: "6/10" },
				{ area: "JD keyword alignment", match: "76/100" },
			],
			gaps: ["Kubernetes", "SOC 2 reviews", "multi-team staffing"],
		},
	},
	{
		id: "pdf",
		user: {
			kind: "pdf",
			fileName: "Orbit-Platform-Lead.pdf",
			text: "Can you tailor a resume for this JD?",
		},
		tools: [
			"Reading your profile",
			"Creating your resume",
			"Compiling your PDF",
		],
		pdf: "Platform Lead - Orbit Systems.pdf",
		ats: {
			role: "Platform Lead",
			company: "Orbit Systems",
			score: 78,
			rows: [
				{ area: "Distributed systems", match: "8/10" },
				{ area: "Mentorship", match: "9/10" },
				{ area: "On-call / reliability", match: "5/10" },
				{ area: "Hiring loops", match: "4/10" },
				{ area: "JD keyword alignment", match: "71/100" },
			],
			gaps: ["Kafka", "SLO ownership", "hiring loops"],
		},
	},
	{
		id: "jd",
		user: {
			kind: "jd",
			text: "Staff Engineer, Fieldnote\n\nWe are hiring a staff engineer to lead the product platform. You will own GraphQL services, set direction across squads, and partner with PMs on roadmap tradeoffs. Must-haves: TypeScript, distributed systems, and a record of mentoring senior engineers. Nice to have: Kubernetes, SOC 2, and hiring.\n\nYou will raise the quality bar and make the hard calls when product and reliability pull in different directions.",
		},
		tools: ["Reading your profile", "Creating your resume"],
		pdf: "Staff Engineer - Fieldnote.pdf",
		ats: {
			role: "Staff Engineer",
			company: "Fieldnote",
			score: 91,
			rows: [
				{ area: "TypeScript", match: "10/10" },
				{ area: "GraphQL platform", match: "9/10" },
				{ area: "Mentorship", match: "9/10" },
				{ area: "Cross-squad direction", match: "8/10" },
				{ area: "JD keyword alignment", match: "88/100" },
			],
			gaps: ["Kubernetes", "SOC 2", "formal hiring loops"],
		},
	},
	{
		id: "question",
		user: {
			kind: "question",
			text: "What should I emphasize for staff engineer roles?",
		},
		tools: ["Reading your profile"],
		reply: "Lead with the GraphQL migration: you owned the cutover and cut p95 latency 33%. Right after that, the onboarding system 40+ PMs still use. Staff screens want proof you moved a platform other teams depend on. Keep mentorship as a short proof point, not the headline.",
	},
	{
		id: "cert",
		user: {
			kind: "question",
			text: "I just got a certification on AWS Cloud. Update my profile.",
		},
		tools: ["Learning about you", "Updating your profile"],
		profile: {
			title: "Updated your profile",
			detail: "AWS Cloud · Certifications",
		},
		reply: "It's saved. I can pull it into the next resume when you share a role.",
	},
];

function sceneTiming(scene: Scene) {
	const toolsDoneAt = TOOLS_AT + scene.tools.length * TOOL_STAGGER;
	const pdfAt = scene.pdf ? toolsDoneAt + 240 : toolsDoneAt;
	const resultAt = scene.ats || scene.reply || scene.profile ? pdfAt + 360 : toolsDoneAt;
	const nextAt = resultAt + 5600;
	return { toolsDoneAt, pdfAt, resultAt, nextAt };
}

function usePrefersReducedMotion() {
	const [reduced, setReduced] = useState(false);

	useEffect(() => {
		const media = window.matchMedia("(prefers-reduced-motion: reduce)");
		const sync = () => setReduced(media.matches);
		sync();
		media.addEventListener("change", sync);
		return () => media.removeEventListener("change", sync);
	}, []);

	return reduced;
}

function FileGlyph({ label, tone }: { label: string; tone: "pdf" | "link" }) {
	return (
		<span
			className={cn(
				"flex size-9 shrink-0 items-center justify-center rounded-md text-[9px] font-semibold tracking-wide text-white",
				tone === "pdf" ? "bg-[#e53935]" : "bg-[#0a66c2]",
			)}
		>
			{label}
		</span>
	);
}

function UserBubble({ children, clamp }: { children: ReactNode; clamp?: boolean }) {
	return (
		<div className="ml-auto w-fit max-w-[18.5rem] rounded-md bg-secondary px-3 py-2 text-[13px] leading-5 text-foreground">
			<div className={clamp ? "line-clamp-3 whitespace-pre-wrap" : undefined}>
				{children}
			</div>
		</div>
	);
}

function FileCard({
	label,
	tone,
	name,
	subtitle,
	align = "start",
	showDownload = false,
}: {
	label: string;
	tone: "pdf" | "link";
	name: string;
	subtitle: string;
	align?: "start" | "end";
	showDownload?: boolean;
}) {
	return (
		<div
			className={cn(
				"inline-flex w-fit max-w-[18.5rem] items-center gap-2.5 rounded-md bg-secondary py-1.5 pl-2.5 pr-2 text-foreground",
				align === "end" && "ml-auto",
				showDownload && "pr-1.5",
			)}
		>
			<FileGlyph label={label} tone={tone} />
			<span className="flex min-w-0 flex-col justify-center gap-0.5">
				<span className="truncate text-[13px] font-medium leading-tight">
					{name}
				</span>
				<span className="text-[11px] leading-none text-muted-foreground">
					{subtitle}
				</span>
			</span>
			{showDownload ? (
				<span className="flex size-8 shrink-0 items-center justify-center text-muted-foreground">
					<DownloadSimpleIcon size={16} weight="bold" />
				</span>
			) : null}
		</div>
	);
}

function UserShare({ share }: { share: UserShare }) {
	if (share.kind === "linkedin") {
		return (
			<div className="ml-auto flex w-fit max-w-[18.5rem] flex-col items-end gap-1">
				<FileCard
					label="in"
					tone="link"
					name={share.href}
					subtitle="Job posting"
					align="end"
				/>
				<UserBubble>{share.text}</UserBubble>
			</div>
		);
	}

	if (share.kind === "pdf") {
		return (
			<div className="ml-auto flex w-fit max-w-[18.5rem] flex-col items-end gap-1">
				<FileCard
					label="PDF"
					tone="pdf"
					name={share.fileName}
					subtitle="PDF"
					align="end"
				/>
				<UserBubble>{share.text}</UserBubble>
			</div>
		);
	}

	return <UserBubble clamp={share.kind === "jd"}>{share.text}</UserBubble>;
}

function ToolSteps({
	tools,
	elapsed,
	collapsed,
}: {
	tools: string[];
	elapsed: number;
	collapsed: boolean;
}) {
	const completed = Math.max(0, Math.floor((elapsed - TOOLS_AT) / TOOL_STAGGER));

	if (collapsed) {
		return (
			<p className="text-[13px] leading-5 text-muted-foreground">
				{tools.length} step{tools.length === 1 ? "" : "s"} completed
			</p>
		);
	}

	return (
		<ol className="flex flex-col gap-1.5">
			{tools.map((label, index) => {
				const running = index === completed;
				const done = index < completed;
				const pending = index > completed;

				return (
					<li key={label} className="flex items-center gap-2">
						<span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground">
							{running ? (
								<CircleNotchIcon size={12} className="animate-spin" />
							) : done ? (
								<CheckIcon size={12} weight="bold" />
							) : (
								<span className="size-1 rounded-full bg-border" />
							)}
						</span>
						<span
							className={cn(
								"text-[13px] leading-5",
								pending
									? "text-muted-soft"
									: running
										? "text-foreground"
										: "text-muted-foreground",
							)}
						>
							{label}
							{running ? "…" : ""}
						</span>
					</li>
				);
			})}
		</ol>
	);
}

function PdfRow({ name }: { name: string }) {
	return (
		<FileCard
			label="PDF"
			tone="pdf"
			name={name}
			subtitle="PDF ready"
			showDownload
		/>
	);
}

function AtsPanel({ ats }: { ats: AtsScene }) {
	return (
		<div className="min-h-0 border-t border-border pt-2">
			<div className="flex items-baseline justify-between gap-3">
				<div className="min-w-0">
					<p className="text-[13px] font-medium text-foreground">
						ATS Analysis
					</p>
					<p className="truncate text-[12px] text-muted-foreground">
						{ats.role} at {ats.company}
					</p>
				</div>
				<p className="shrink-0 text-[13px] font-semibold text-brand">
					{ats.score}/100
				</p>
			</div>

			<table className="mt-2 w-full text-[12px] leading-4">
				<thead>
					<tr className="text-muted-soft">
						<th className="pb-1 text-left font-medium">Area</th>
						<th className="pb-1 text-right font-medium">Match</th>
					</tr>
				</thead>
				<tbody>
					{ats.rows.map((row) => (
						<tr key={row.area} className="border-t border-border">
							<td className="py-1 text-foreground">{row.area}</td>
							<td className="py-1 text-right tabular-nums text-foreground">
								{row.match}
							</td>
						</tr>
					))}
				</tbody>
			</table>

			<div className="mt-2 border-t border-border pt-2">
				<p className="text-[12px] font-medium text-foreground">
					Biggest gaps
				</p>
				<p className="mt-0.5 text-[12px] leading-5 text-muted-foreground">
					{ats.gaps.join(" · ")}
				</p>
			</div>
		</div>
	);
}

function ProfileUpdate({ title, detail }: { title: string; detail: string }) {
	return (
		<div className="inline-flex w-fit max-w-[18.5rem] items-center gap-2.5 rounded-md bg-secondary py-1.5 pl-2.5 pr-3">
			<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-pastel-sage text-[#2f6b4a]">
				<CheckIcon size={16} weight="bold" />
			</span>
			<span className="flex min-w-0 flex-col justify-center gap-0.5">
				<span className="truncate text-[13px] font-medium leading-tight text-foreground">
					{title}
				</span>
				<span className="truncate text-[11px] leading-none text-muted-foreground">
					{detail}
				</span>
			</span>
		</div>
	);
}

function ReplyText({ text }: { text: string }) {
	return (
		<p className="text-[13px] leading-5 text-foreground">
			{text}
		</p>
	);
}

export function ProductPreview() {
	const reduced = usePrefersReducedMotion();
	const [variantIndex, setVariantIndex] = useState(0);
	const [elapsed, setElapsed] = useState(USER_AT);
	const scene = SCENES[variantIndex] ?? SCENES[0];
	const timing = sceneTiming(scene);
	const showTools = reduced || elapsed >= TOOLS_AT;
	const showPdf = Boolean(scene.pdf) && (reduced || elapsed >= timing.pdfAt);
	const showAts = Boolean(scene.ats) && (reduced || elapsed >= timing.resultAt);
	const showReply = Boolean(scene.reply) && (reduced || elapsed >= timing.resultAt);
	const showProfile = Boolean(scene.profile) && (reduced || elapsed >= timing.resultAt);
	const toolsCollapsed = showPdf || showAts || showReply || showProfile;

	useEffect(() => {
		if (reduced) {
			setElapsed(timing.resultAt);
			const id = window.setTimeout(() => {
				setVariantIndex((index) => (index + 1) % SCENES.length);
			}, 6400);
			return () => window.clearTimeout(id);
		}

		setElapsed(USER_AT);
		let next = USER_AT;
		const id = window.setInterval(() => {
			next += TICK_MS;
			if (next >= timing.nextAt) {
				setVariantIndex((index) => (index + 1) % SCENES.length);
				return;
			}
			setElapsed(next);
		}, TICK_MS);

		return () => window.clearInterval(id);
	}, [reduced, timing.nextAt, timing.resultAt, variantIndex]);

	return (
		<div className="rounded-2xl bg-pastel-blush p-4 sm:p-5">
			<div
				aria-hidden="true"
				className="flex h-[30rem] flex-col gap-2 overflow-hidden rounded-xl border border-border bg-card p-4 sm:h-[32rem] sm:p-5"
			>
				<UserShare share={scene.user} />
				{showTools ? (
					<ToolSteps
						tools={scene.tools}
						elapsed={reduced ? timing.toolsDoneAt : elapsed}
						collapsed={toolsCollapsed}
					/>
				) : null}
				{showPdf && scene.pdf ? <PdfRow name={scene.pdf} /> : null}
				{showAts && scene.ats ? <AtsPanel ats={scene.ats} /> : null}
				{showProfile && scene.profile ? (
					<ProfileUpdate
						title={scene.profile.title}
						detail={scene.profile.detail}
					/>
				) : null}
				{showReply && scene.reply ? <ReplyText text={scene.reply} /> : null}
			</div>
			<p className="sr-only">
				Demo of chatting with the agent: share a job post, watch it
				write a resume, then read the ATS score, match table, and
				biggest gaps.
			</p>
		</div>
	);
}
