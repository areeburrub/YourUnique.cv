import { ArrowRightIcon, CheckCircleIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";

import { ClosingCta } from "@/components/landing/closing-cta";
import { ToolImage } from "@/components/tools/tool-icon";
import { ToolsChrome } from "@/components/tools/tools-chrome";
import { FREE_TOOL_NAME, FREE_TOOL_PATH, TOOL_LIST } from "@/lib/tools/catalog";
import { toolsIndexJsonLd } from "@/lib/tools/jsonld";
import { TRIAL_DAYS } from "@/lib/plan-copy";
import { SITE_NAME } from "@/lib/site";

const TRUST_POINTS = ["No account needed", "PDF stays private", "Free to use"];

export const dynamic = "force-static";

export const metadata: Metadata = {
	title: FREE_TOOL_NAME,
	description: `Free Tool: ATS resume checker, job description keyword extractor, and resume vs job match from ${SITE_NAME}. Upload a PDF, no account to run. Rewrite the CV in a ${TRIAL_DAYS}-day trial.`,
	keywords: [
		"free tool",
		"ATS resume checker",
		"job description keyword extractor",
		"resume job match",
		"free resume tools",
	],
	alternates: {
		canonical: FREE_TOOL_PATH,
	},
	openGraph: {
		type: "website",
		title: `${FREE_TOOL_NAME} | ${SITE_NAME}`,
		description: `Free Tool: ATS checker, keyword extractor, and job-match from ${SITE_NAME}.`,
		url: FREE_TOOL_PATH,
	},
};

export default function ToolsIndexPage() {
	const jsonLd = toolsIndexJsonLd();

	return (
		<ToolsChrome>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<section>
				<div className="rail px-5 pt-12 pb-8 sm:px-8 md:px-10 md:pt-16">
					<p className="eyebrow text-brand!">{FREE_TOOL_NAME}</p>
					<h1 className="font-display mt-4 max-w-[560px] text-[40px] leading-12 font-semibold tracking-[-0.8px] text-foreground sm:text-[48px] sm:leading-14 sm:tracking-[-0.96px]">
						Check the resume you have. Then write one for the job.
					</h1>
					<p className="mt-5 max-w-[480px] text-base leading-7 text-muted-foreground">
						Upload a resume PDF, paste the job, get a short read.
						No account. When you want a CV written for that
						posting, start a {TRIAL_DAYS}-day trial on {SITE_NAME}.
					</p>
					<ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
						{TRUST_POINTS.map((point) => (
							<li
								key={point}
								className="flex items-center gap-1.5 text-sm text-muted-foreground"
							>
								<CheckCircleIcon
									size={16}
									weight="fill"
									className="text-brand"
								/>
								{point}
							</li>
						))}
					</ul>
				</div>
			</section>

			<section>
				<div className="rail px-5 pb-20 sm:px-8 md:px-10 md:pb-28">
					<div className="grid gap-3 sm:grid-cols-2">
						{TOOL_LIST.map((tool) => (
							<Link
								key={tool.slug}
								href={tool.path}
								className="group flex items-start gap-3.5 rounded-[20px] border border-border bg-card p-3.5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:bg-muted hover:shadow-md"
							>
								<ToolImage slug={tool.slug} size="compact" />
								<div className="min-w-0 flex-1 pt-0.5">
									<h2 className="font-display truncate text-[16px] leading-6 font-semibold tracking-[-0.2px] text-foreground">
										{tool.name}
									</h2>
									<p className="mt-0.5 line-clamp-2 text-[13px] leading-5 text-muted-foreground">
										{tool.description}
									</p>
									<p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-brand">
										Open Free Tool
										<ArrowRightIcon
											size={14}
											weight="bold"
											className="transition-transform group-hover:translate-x-0.5"
										/>
									</p>
								</div>
							</Link>
						))}
					</div>
				</div>
			</section>

			<ClosingCta />
		</ToolsChrome>
	);
}
