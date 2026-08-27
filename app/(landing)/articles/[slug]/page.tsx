import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticlePage } from "@/components/articles/article-page";
import {
	articleMarkdownPath,
	articlePath,
	extractArticleHeadings,
	getCachedPublishedArticle,
} from "@/lib/articles";
import { listPublishedArticleSlugs } from "@/lib/db/articles";
import { SITE_NAME } from "@/lib/site";

export const revalidate = 3600;
export const dynamicParams = true;

type ArticleRouteProps = {
	params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
	try {
		const slugs = await listPublishedArticleSlugs();
		return slugs.map((slug) => ({ slug }));
	} catch {
		return [];
	}
}

export async function generateMetadata({
	params,
}: ArticleRouteProps): Promise<Metadata> {
	const { slug } = await params;
	const article = await getCachedPublishedArticle(slug);
	if (!article) {
		return {
			title: "Article not found",
			robots: { index: false, follow: false },
		};
	}

	const title = article.seoTitle ?? article.title;
	const published = article.publishedAt ?? article.createdAt;
	const url = articlePath(article.slug);

	return {
		title,
		description: article.description,
		keywords: article.keywords,
		authors: [{ name: article.authorName, url: article.authorUrl ?? undefined }],
		creator: article.authorName,
		publisher: SITE_NAME,
		alternates: {
			canonical: url,
			types: {
				"text/markdown": articleMarkdownPath(article.slug),
			},
		},
		openGraph: {
			type: "article",
			locale: "en_US",
			url,
			siteName: SITE_NAME,
			title,
			description: article.description,
			publishedTime: published.toISOString(),
			modifiedTime: article.updatedAt.toISOString(),
			authors: [article.authorName],
			tags: article.keywords,
			images: [
				{
					url: article.coverImageUrl,
					alt: article.coverImageAlt,
					width: 1600,
					height: 900,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description: article.description,
			images: [article.coverImageUrl],
		},
		robots: {
			index: true,
			follow: true,
			googleBot: {
				index: true,
				follow: true,
				"max-image-preview": "large",
				"max-snippet": -1,
				"max-video-preview": -1,
			},
		},
	};
}

export default async function PublishedArticlePage({
	params,
}: ArticleRouteProps) {
	const { slug } = await params;
	const article = await getCachedPublishedArticle(slug);
	if (!article) {
		notFound();
	}

	const headings = extractArticleHeadings(article.content);

	return <ArticlePage article={article} headings={headings} />;
}
