import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { SlideButton } from "@/components/landing/slide-button";
import { listBuiltinTemplates } from "@/lib/resume-templates/builtins";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
	title: "Templates",
	description:
		"Built-in resume layouts for YourUnique.cv. Keep the look of the file you upload, or start from a library page.",
	alternates: {
		canonical: "/templates",
	},
};

export default function TemplateLibraryPage() {
	const templates = listBuiltinTemplates();

	return (
		<div className="flex flex-1 flex-col bg-background">
			<SiteHeader />
			<main>
				<section>
					<div className="rail px-5 pt-12 pb-8 sm:px-8 md:px-10 md:pt-16">
						<p className="eyebrow text-brand!">Templates</p>
						<h1 className="font-display mt-4 max-w-[520px] text-[40px] leading-12 font-semibold tracking-[-0.8px] text-foreground sm:text-[48px] sm:leading-14 sm:tracking-[-0.96px]">
							Built-in layouts, or bring your own
						</h1>
						<p className="mt-5 max-w-[440px] text-base leading-7 text-muted-foreground">
							Upload a resume and we keep that design for later
							drafts. These library pages are here if you want a
							cleaner starting point.
						</p>
					</div>
				</section>

				<section>
					<div className="rail px-5 pb-20 sm:px-8 md:px-10 md:pb-28">
						<div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
							{templates.map((template) => (
								<article key={template.id} className="flex flex-col">
									<div className="overflow-hidden rounded-[28px] bg-pastel-blush p-3">
										<div className="overflow-hidden rounded-2xl bg-card">
											{template.previewPath ? (
												<img
													src={template.previewPath}
													alt={`${template.name} preview`}
													className="aspect-210/297 h-auto w-full object-cover object-top"
												/>
											) : (
												<div className="flex aspect-210/297 flex-col justify-between bg-[#fffcf8] px-6 py-7 dark:bg-card">
													<div>
														<div className="h-2 w-24 rounded-full bg-foreground/70" />
														<div className="mt-4 space-y-1.5">
															<div className="h-1.5 w-full rounded-full bg-border" />
															<div className="h-1.5 w-5/6 rounded-full bg-border" />
															<div className="h-1.5 w-2/3 rounded-full bg-border" />
														</div>
													</div>
													<p className="text-[13px] text-muted-soft">
														{template.styleLabel}
													</p>
												</div>
											)}
										</div>
										<div className="mt-2.5 flex items-center gap-2 px-0.5">
											<div className="flex items-center gap-1">
												{template.colors.slice(0, 5).map((color) => (
													<span
														key={color}
														className="size-2.5 rounded-full ring-1 ring-black/10"
														style={{ backgroundColor: color }}
													/>
												))}
											</div>
											<span className="text-xs text-muted-foreground">
												{template.styleLabel}
											</span>
										</div>
									</div>
									<div className="mt-4 flex flex-1 flex-col">
										<div className="flex items-center gap-2">
											<h2 className="text-[18px] font-semibold tracking-[-0.2px] text-foreground">
												{template.name}
											</h2>
											<span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
												{template.category}
											</span>
										</div>
										<p className="mt-2 text-sm leading-6 text-muted-foreground">
											{template.description}
										</p>
										<div className="mt-5 flex flex-wrap gap-2">
											{template.previewPdfPath ? (
												<a
													href={template.previewPdfPath}
													target="_blank"
													rel="noreferrer"
													className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-card px-5 text-[14px] font-medium text-foreground transition-colors hover:bg-muted"
												>
													Preview PDF
												</a>
											) : null}
											<Link
												href="/sign-up"
												className="inline-flex h-11 items-center justify-center rounded-full border border-brand bg-brand px-5 text-[14px] font-medium text-brand-foreground transition-colors hover:bg-brand/90"
											>
												Use this layout
											</Link>
										</div>
									</div>
								</article>
							))}
						</div>

						<div className="mt-14 rounded-[32px] bg-pastel-sage px-6 py-10 sm:px-10">
							<h2 className="font-display text-[28px] leading-9 font-semibold tracking-[-0.4px] text-foreground">
								Have a format you already like?
							</h2>
							<p className="mt-3 max-w-[420px] text-base leading-7 text-muted-foreground">
								{SITE_NAME} can extract the look of the resume
								you upload, then write new drafts in that
								design.
							</p>
							<div className="mt-6">
								<SlideButton href="/sign-up">
									Get started free
								</SlideButton>
							</div>
						</div>
					</div>
				</section>
			</main>
			<SiteFooter />
		</div>
	);
}
