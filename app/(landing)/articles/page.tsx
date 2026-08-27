import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import {
	formatArticleDate,
	getCachedFeaturedArticles,
} from "@/lib/articles";
import { articlesIndexJsonLd } from "@/lib/articles-jsonld";
import { SITE_NAME } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
	title: "Articles",
	description: `Guides on tailored resumes, ATS scoring, and job search from ${SITE_NAME}.`,
	alternates: {
		canonical: "/articles",
	},
	openGraph: {
		type: "website",
		title: `Articles | ${SITE_NAME}`,
		description: `Guides on tailored resumes, ATS scoring, and job search from ${SITE_NAME}.`,
		url: "/articles",
	},
};

export default async function ArticlesIndexPage() {
	let articles: Awaited<ReturnType<typeof getCachedFeaturedArticles>> = [];
	try {
		articles = await getCachedFeaturedArticles();
	} catch {
		articles = [];
	}
	const jsonLd = articlesIndexJsonLd(
		articles.map((article) => ({ slug: article.slug, title: article.title })),
	);

	return (
		<div className="flex flex-1 flex-col bg-background">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<SiteHeader />
			<main>
				<section>
					<div className="rail px-5 pt-12 pb-8 sm:px-8 md:px-10 md:pt-16">
						<p className="eyebrow text-brand!">Articles</p>
						<h1 className="font-display mt-4 max-w-[520px] text-[40px] leading-12 font-semibold tracking-[-0.8px] text-foreground sm:text-[48px] sm:leading-14 sm:tracking-[-0.96px]">
							Writing that helps you get the interview
						</h1>
						<p className="mt-5 max-w-[440px] text-base leading-7 text-muted-foreground">
							Practical notes on tailored resumes, ATS, and the
							job search. Featured pieces live here.
						</p>
					</div>
				</section>

				<section>
					<div className="rail px-5 pb-20 sm:px-8 md:px-10 md:pb-28">
						{articles.length === 0 ? (
							<p className="text-base text-muted-foreground">
								No featured articles yet.
							</p>
						) : (
							<div className="grid gap-8 sm:grid-cols-2">
								{articles.map((article) => {
									const published =
										article.publishedAt ?? article.createdAt;
									return (
										<article key={article.id} className="flex flex-col">
											<Link
												href={`/articles/${article.slug}`}
												className="group flex flex-1 flex-col"
											>
												<div className="overflow-hidden rounded-[28px] bg-pastel-blush">
													<img
														src={article.coverImageUrl}
														alt={article.coverImageAlt}
														width={1200}
														height={675}
														className="aspect-16/9 h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
													/>
												</div>
												<p className="mt-4 text-[13px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
													{article.category ?? "Guide"}
												</p>
												<h2 className="font-display mt-2 text-[22px] leading-7 font-semibold tracking-[-0.4px] text-foreground">
													{article.title}
												</h2>
												<p className="mt-2 line-clamp-3 text-base leading-7 text-muted-foreground">
													{article.description}
												</p>
												<p className="mt-3 text-[14px] text-muted-foreground">
													<time dateTime={published.toISOString()}>
														{formatArticleDate(published)}
													</time>
												</p>
											</Link>
										</article>
									);
								})}
							</div>
						)}
					</div>
				</section>
			</main>
			<SiteFooter />
		</div>
	);
}
