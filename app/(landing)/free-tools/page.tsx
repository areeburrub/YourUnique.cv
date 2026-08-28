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

const TRUST_POINTS = ["No account needed", "PDF stays private", "Results in seconds"];

export const dynamic = "force-static";

export const metadata: Metadata = {
	title: FREE_TOOL_NAME,
	description: `Free Tools: ATS resume checker, job description keyword extractor, and resume vs job match from ${SITE_NAME}. Upload a PDF, no account to run. Rewrite the CV in a ${TRIAL_DAYS}-day trial.`,
	keywords: [
		"free tools",
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
		description: `Free Tools: ATS checker, keyword extractor, and job-match from ${SITE_NAME}.`,
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
				<div className="rail px-5 pt-10 pb-10 sm:px-8 md:px-10 md:pt-14 md:pb-12">
					<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
						<div className="max-w-[640px]">
							<p className="eyebrow text-brand!">
								{FREE_TOOL_NAME}
							</p>
							<h1 className="font-display mt-3 text-[36px] leading-11 font-semibold tracking-[-0.72px] text-balance text-foreground sm:mt-4 sm:text-[48px] sm:leading-14 sm:tracking-[-0.96px]">
								Check your resume against the job
							</h1>
						</div>
						<div className="max-w-[420px] lg:pb-1">
							<p className="text-pretty text-base leading-7 text-muted-foreground">
								ATS score, missing keywords, and a match
								read. Upload a PDF, paste the posting. No
								account.
							</p>
							<ul className="mt-5 flex flex-col gap-2">
								{TRUST_POINTS.map((point) => (
									<li
										key={point}
										className="flex items-center gap-1.5 text-sm text-foreground/80"
									>
										<CheckCircleIcon
											size={16}
											weight="fill"
											className="text-brand"
											aria-hidden
										/>
										{point}
									</li>
								))}
							</ul>
						</div>
					</div>
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
										Open Free Tools
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
