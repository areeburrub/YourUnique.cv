"use client";

import { ToolPromoCta } from "@/components/tools/tool-promo-cta";
import type { ToolSlug } from "@/lib/tools/catalog";
import { TOOLS } from "@/lib/tools/catalog";
import type { ToolRunResult } from "@/lib/tools/schemas";

function scoreBadges(score: number) {
	if (score >= 90) {
		return [
			{ emoji: "🔥", label: "Locked in" },
			{ emoji: "🏆", label: "Main character" },
		];
	}
	if (score >= 75) {
		return [
			{ emoji: "💪", label: "Built different" },
			{ emoji: "✨", label: "Almost there" },
		];
	}
	if (score >= 50) {
		return [
			{ emoji: "😬", label: "It's giving mid" },
			{ emoji: "🛠️", label: "Glow-up needed" },
		];
	}
	return [
		{ emoji: "💀", label: "Not the one" },
		{ emoji: "📉", label: "Needs a rewrite" },
	];
}

function ScoreCard({
	label,
	score,
	hint,
}: {
	label: string;
	score: number;
	hint?: string;
}) {
	const rounded = Math.round(score);

	return (
		<div className="rounded-[24px] border border-border bg-card px-5 py-5">
			<p className="text-[13px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
				{label}
			</p>
			<p className="font-display mt-2 text-[40px] leading-none font-semibold tracking-[-1px] text-foreground">
				{rounded}/100
			</p>
			<ul className="mt-4 flex flex-wrap gap-2">
				{scoreBadges(rounded).map((badge) => (
					<li
						key={badge.label}
						className="inline-flex items-center gap-1.5 rounded-full bg-pastel-blush px-3 py-1 text-sm text-foreground"
					>
						<span aria-hidden>{badge.emoji}</span>
						{badge.label}
					</li>
				))}
			</ul>
			{hint ? (
				<p className="mt-3 text-base leading-7 text-muted-foreground">
					{hint}
				</p>
			) : null}
		</div>
	);
}

function ChipList({
	title,
	items,
	empty,
}: {
	title: string;
	items: string[];
	empty: string;
}) {
	return (
		<div>
			<h3 className="text-[15px] font-medium text-foreground">{title}</h3>
			{items.length === 0 ? (
				<p className="mt-2 text-sm leading-6 text-muted-foreground">
					{empty}
				</p>
			) : (
				<ul className="mt-3 flex flex-wrap gap-2">
					{items.map((item) => (
						<li
							key={item}
							className="rounded-full border border-border bg-card px-3 py-1 text-sm text-foreground"
						>
							{item}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

function AtsResultView({ result }: { result: Extract<ToolRunResult, { tool: "ats-resume-checker" }> }) {
	return (
		<div className="space-y-8">
			<ScoreCard
				label="ATS match"
				score={result.data.score}
				hint={result.data.verdict}
			/>
			{result.data.areas.length > 0 ? (
				<div>
					<h3 className="text-[15px] font-medium text-foreground">
						Area scores
					</h3>
					<ul className="mt-3 divide-y divide-border overflow-hidden rounded-[20px] border border-border bg-card">
						{result.data.areas.map((area) => (
							<li
								key={area.name}
								className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
							>
								<span className="text-foreground">{area.name}</span>
								<span className="tabular-nums text-muted-foreground">
									{Math.round(area.match)}/100
								</span>
							</li>
						))}
					</ul>
				</div>
			) : null}
			<ChipList
				title="Already in your resume"
				items={result.data.present}
				empty="No clear keyword overlap in the pasted text."
			/>
			<ChipList
				title="Missing vs this job"
				items={result.data.missing}
				empty="No obvious missing keywords from the pasted posting."
			/>
		</div>
	);
}

function KeywordsResultView({
	result,
}: {
	result: Extract<
		ToolRunResult,
		{ tool: "job-description-keyword-extractor" }
	>;
}) {
	return (
		<div className="space-y-8">
			<ChipList
				title="Must-have keywords"
				items={result.data.mustHave}
				empty="No required keywords stood out."
			/>
			<ChipList
				title="Tools and stack"
				items={result.data.tools}
				empty="No specific tools listed."
			/>
			<ChipList
				title="Nice to have"
				items={result.data.niceToHave}
				empty="No optional keywords stood out."
			/>
			<ChipList
				title="Missing from your resume"
				items={result.data.missing}
				empty="Upload your resume above to see which of these you already cover."
			/>
		</div>
	);
}

function MatchResultView({
	result,
}: {
	result: Extract<ToolRunResult, { tool: "resume-job-match" }>;
}) {
	const fitLabel =
		result.data.fit === "strong"
			? "Strong fit"
			: result.data.fit === "partial"
				? "Partial fit"
				: "Weak fit";

	return (
		<div className="space-y-8">
			<ScoreCard
				label={fitLabel}
				score={result.data.match}
				hint={result.data.note}
			/>
			<ChipList
				title="Overlapping skills"
				items={result.data.overlapping}
				empty="Little overlap in the pasted text."
			/>
			<ChipList
				title="Gaps you should not claim"
				items={result.data.gaps}
				empty="No clear gaps from the pasted posting."
			/>
		</div>
	);
}

export function ToolResultPanel({
	slug,
	result,
}: {
	slug: ToolSlug;
	result: ToolRunResult;
}) {
	const tool = TOOLS[slug];

	return (
		<div className="space-y-8">
			{result.tool === "ats-resume-checker" ? (
				<AtsResultView result={result} />
			) : result.tool === "job-description-keyword-extractor" ? (
				<KeywordsResultView result={result} />
			) : (
				<MatchResultView result={result} />
			)}
			<ToolPromoCta
				slug={slug}
				headline={tool.ctaHeadline}
				body={tool.ctaBody}
				button={tool.ctaButton}
				source="result"
			/>
		</div>
	);
}
