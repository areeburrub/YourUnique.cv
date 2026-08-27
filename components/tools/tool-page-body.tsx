import { ArrowRightIcon, CheckCircleIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";

import { ClosingCta } from "@/components/landing/closing-cta";
import { ToolForm } from "@/components/tools/tool-form";
import { ToolImage } from "@/components/tools/tool-icon";
import { ToolPromoCta } from "@/components/tools/tool-promo-cta";
import { ToolsChrome } from "@/components/tools/tools-chrome";
import type { ToolDefinition, ToolSlug } from "@/lib/tools/catalog";
import { FREE_TOOL_NAME, FREE_TOOL_PATH, TOOLS } from "@/lib/tools/catalog";

const TRUST_POINTS = ["No account needed", "PDF stays private", "Results in seconds"];

function RelatedTools({ current }: { current: ToolSlug }) {
	const others = Object.values(TOOLS).filter((tool) => tool.slug !== current);

	return (
		<section>
			<div className="rail border-t border-border px-5 py-16 sm:px-8 md:px-10">
				<h2 className="font-display text-[24px] leading-8 font-semibold tracking-[-0.4px] text-foreground">
					More Free Tools
				</h2>
				<ul className="mt-6 grid gap-4 sm:grid-cols-2">
					{others.map((tool) => (
						<li key={tool.slug}>
							<Link
								href={tool.path}
								className="group flex items-start gap-4 rounded-[24px] border border-border bg-card p-4 transition-colors hover:border-brand/30 hover:bg-muted sm:p-5"
							>
								<ToolImage slug={tool.slug} size="card" />
								<div className="min-w-0 flex-1">
									<p className="text-[16px] font-medium text-foreground">
										{tool.name}
									</p>
									<p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground">
										{tool.description}
									</p>
									<p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-brand">
										Open Free Tools
										<ArrowRightIcon
											size={14}
											weight="bold"
											className="transition-transform group-hover:translate-x-0.5"
										/>
									</p>
								</div>
							</Link>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}

export function ToolPageBody({
	tool,
	jsonLd,
	turnstileSiteKey,
}: {
	tool: ToolDefinition;
	jsonLd: unknown;
	turnstileSiteKey: string;
}) {
	return (
		<ToolsChrome>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<section>
				<div className="rail px-5 pt-10 pb-8 sm:px-8 md:px-10 md:pt-14">
					<nav className="text-sm text-muted-foreground">
						<Link href="/" className="hover:text-foreground">
							Home
						</Link>
						<span className="px-2">/</span>
						<Link href={FREE_TOOL_PATH} className="hover:text-foreground">
							{FREE_TOOL_NAME}
						</Link>
						<span className="px-2">/</span>
						<span className="text-foreground">{tool.name}</span>
					</nav>
					<ToolImage
						slug={tool.slug}
						size="page"
						className="mt-6 rounded-2xl"
					/>
					<p className="eyebrow text-brand! mt-5">{tool.eyebrow}</p>
					<h1 className="font-display mt-4 max-w-[680px] text-[40px] leading-12 font-semibold tracking-[-0.8px] text-foreground sm:text-[48px] sm:leading-14 sm:tracking-[-0.96px]">
						{tool.h1}
					</h1>
					<p className="mt-5 max-w-[640px] text-base leading-7 text-muted-foreground">
						{tool.description}
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
				<div className="rail px-5 pb-16 sm:px-8 md:px-10 md:pb-20">
					<div className="grid gap-8 lg:grid-cols-[minmax(0,640px)_minmax(240px,1fr)] lg:items-start lg:gap-10">
						<ToolForm tool={tool} turnstileSiteKey={turnstileSiteKey} />
						<div className="lg:sticky lg:top-24">
							<ToolPromoCta
								slug={tool.slug}
								headline={tool.ctaHeadline}
								body={tool.ctaBody}
								button={tool.ctaButton}
								source="page"
							/>
						</div>
					</div>
				</div>
			</section>

			<section>
				<div className="rail border-t border-border px-5 py-16 sm:px-8 md:px-10">
					<h2 className="font-display max-w-[640px] text-[24px] leading-8 font-semibold tracking-[-0.4px] text-foreground">
						Questions
					</h2>
					<dl className="mt-8 grid gap-8 sm:grid-cols-2">
						{tool.faq.map((item) => (
							<div key={item.question}>
								<dt className="text-[17px] font-medium text-foreground">
									{item.question}
								</dt>
								<dd className="mt-2 max-w-[60ch] text-base leading-7 text-muted-foreground">
									{item.answer}
								</dd>
							</div>
						))}
					</dl>
				</div>
			</section>

			<RelatedTools current={tool.slug} />
			<ClosingCta />
		</ToolsChrome>
	);
}
