import Link from "next/link";

import { ArticleMarkdown } from "@/components/articles/article-markdown";
import { ArticleSidebarCta } from "@/components/articles/article-sidebar-cta";
import { ClosingCta } from "@/components/landing/closing-cta";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import {
	type ArticleHeading,
	formatArticleDate,
	readingTimeMinutes,
} from "@/lib/articles";
import { articleJsonLd } from "@/lib/articles-jsonld";
import type { ArticleRow } from "@/lib/db/articles";
import type { ArticleFaq } from "@/lib/db/schema";

function TableOfContents({ headings }: { headings: ArticleHeading[] }) {
	if (headings.length < 3) {
		return null;
	}

	return (
		<nav aria-label="On this page">
			<p className="text-[13px] font-medium tracking-[0.06em] text-foreground uppercase">
				On this page
			</p>
			<ol className="mt-4 space-y-2.5">
				{headings.map((heading) => (
					<li
						key={heading.id}
						className={heading.level === 3 ? "pl-3" : undefined}
					>
						<a
							href={`#${heading.id}`}
							className="text-[15px] leading-6 text-muted-foreground transition-colors duration-200 hover:text-foreground"
						>
							{heading.text}
						</a>
					</li>
				))}
			</ol>
		</nav>
	);
}

export function ArticlePage({
	article,
	headings,
}: {
	article: ArticleRow;
	headings: ArticleHeading[];
}) {
	const faq = article.faq as ArticleFaq[];
	const published = article.publishedAt ?? article.createdAt;
	const minutes = readingTimeMinutes(article.content);
	const jsonLd = articleJsonLd(article);

	return (
		<div className="flex flex-1 flex-col bg-background">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<SiteHeader />
			<main>
				<article>
					<header>
						<div className="rail px-5 pt-10 sm:px-8 md:px-10 md:pt-14">
							<nav
								aria-label="Breadcrumb"
								className="text-[14px] text-muted-foreground"
							>
								<ol className="flex flex-wrap items-center gap-1.5">
									<li>
										<Link
											href="/"
											className="transition-colors duration-200 hover:text-foreground"
										>
											Home
										</Link>
									</li>
									<li aria-hidden>/</li>
									<li>
										<Link
											href="/articles"
											className="transition-colors duration-200 hover:text-foreground"
										>
											Articles
										</Link>
									</li>
									<li aria-hidden>/</li>
									<li className="text-foreground">
										{article.category ?? "Guide"}
									</li>
								</ol>
							</nav>

							<p className="eyebrow mt-8 text-brand!">
								{article.category ?? "Guide"}
							</p>
							<h1 className="article-title font-display mt-4 text-[36px] leading-11 font-semibold tracking-[-0.9px] text-balance text-foreground sm:text-[48px] sm:leading-14 sm:tracking-[-0.96px] md:text-[56px] md:leading-16 md:tracking-[-1.2px]">
								{article.title}
							</h1>
							<p className="article-description mt-5 text-base leading-7 text-pretty text-muted-foreground sm:text-[17px]">
								{article.description}
							</p>
							<p className="mt-5 text-[15px] text-muted-foreground">
								<time dateTime={published.toISOString()}>
									{formatArticleDate(published)}
								</time>
								<span aria-hidden> · </span>
								<span>{minutes} min read</span>
								<span aria-hidden> · </span>
								{article.authorUrl ? (
									<a
										href={article.authorUrl}
										rel="author"
										className="font-medium text-foreground transition-colors duration-200 hover:text-brand"
									>
										{article.authorName}
									</a>
								) : (
									<span className="font-medium text-foreground">
										{article.authorName}
									</span>
								)}
							</p>
						</div>
					</header>

					<div className="rail px-5 pt-8 sm:px-8 md:px-10 md:pt-10">
						<figure className="overflow-hidden rounded-[28px] bg-pastel-blush">
							<img
								src={article.coverImageUrl}
								alt={article.coverImageAlt}
								width={1600}
								height={900}
								fetchPriority="high"
								decoding="async"
								className="aspect-16/9 h-auto w-full object-cover"
							/>
						</figure>
					</div>

					{article.tldr ? (
						<div className="rail px-5 pt-8 sm:px-8 md:px-10">
							<aside className="article-tldr max-w-[760px] rounded-[28px] bg-pastel-blush px-6 py-6 sm:px-8">
								<p className="text-[13px] font-medium tracking-[0.06em] text-foreground uppercase">
									Key takeaway
								</p>
								<p className="mt-3 text-base leading-7 text-pretty text-foreground">
									{article.tldr}
								</p>
							</aside>
						</div>
					) : null}

					<div className="rail px-5 pt-10 pb-8 sm:px-8 md:px-10 md:pt-14">
						<div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-16">
							<ArticleMarkdown content={article.content} />
							<div className="hidden lg:block">
								<div className="space-y-8 lg:sticky lg:top-28">
									<TableOfContents headings={headings} />
									<ArticleSidebarCta />
								</div>
							</div>
						</div>
						<div className="mt-10 lg:hidden">
							<ArticleSidebarCta />
						</div>
					</div>

					{faq.length > 0 ? (
						<section aria-labelledby="article-faq-heading">
							<div className="rail px-5 pb-8 sm:px-8 md:px-10">
								<div className="max-w-[760px] rounded-[32px] bg-card px-6 py-8 sm:px-8 sm:py-10">
									<h2
										id="article-faq-heading"
										className="font-display text-[28px] leading-9 font-semibold tracking-[-0.5px] text-foreground"
									>
										Questions
									</h2>
									<dl className="mt-8 space-y-8">
										{faq.map((item) => (
											<div key={item.question}>
												<dt className="font-display text-lg font-semibold tracking-[-0.3px] text-foreground">
													{item.question}
												</dt>
												<dd className="mt-2 text-base leading-7 text-muted-foreground">
													{item.answer}
												</dd>
											</div>
										))}
									</dl>
								</div>
							</div>
						</section>
					) : null}
				</article>

				<ClosingCta />
			</main>
			<SiteFooter />
		</div>
	);
}
