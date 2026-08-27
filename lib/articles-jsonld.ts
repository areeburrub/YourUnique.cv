import type { ArticleRow } from "@/lib/db/articles";
import type { ArticleFaq } from "@/lib/db/schema";
import { getSiteUrl, SITE_NAME } from "@/lib/site";

export function articleJsonLd(article: ArticleRow) {
	const siteUrl = getSiteUrl();
	const url = `${siteUrl}/articles/${article.slug}`;
	const faq = article.faq as ArticleFaq[];
	const published = article.publishedAt ?? article.createdAt;
	const modified = article.updatedAt;

	const graph: Record<string, unknown>[] = [
		{
			"@type": "BlogPosting",
			"@id": `${url}#article`,
			headline: article.title,
			description: article.description,
			image: [article.coverImageUrl],
			datePublished: published.toISOString(),
			dateModified: modified.toISOString(),
			mainEntityOfPage: {
				"@type": "WebPage",
				"@id": url,
			},
			url,
			inLanguage: "en-US",
			keywords: article.keywords.join(", "),
			articleSection: article.category ?? undefined,
			author: {
				"@type": "Person",
				name: article.authorName,
				url: article.authorUrl ?? "https://areeburrub.dev",
			},
			publisher: {
				"@type": "Organization",
				name: SITE_NAME,
				url: siteUrl,
				logo: {
					"@type": "ImageObject",
					url: `${siteUrl}/logo.svg`,
				},
			},
			speakable: {
				"@type": "SpeakableSpecification",
				cssSelector: [".article-title", ".article-tldr", ".article-description"],
			},
			abstract: article.tldr ?? article.description,
		},
		{
			"@type": "BreadcrumbList",
			itemListElement: [
				{
					"@type": "ListItem",
					position: 1,
					name: "Home",
					item: siteUrl,
				},
				{
					"@type": "ListItem",
					position: 2,
					name: "Articles",
					item: `${siteUrl}/articles`,
				},
				{
					"@type": "ListItem",
					position: 3,
					name: article.title,
					item: url,
				},
			],
		},
	];

	if (faq.length > 0) {
		graph.push({
			"@type": "FAQPage",
			"@id": `${url}#faq`,
			mainEntity: faq.map((item) => ({
				"@type": "Question",
				name: item.question,
				acceptedAnswer: {
					"@type": "Answer",
					text: item.answer,
				},
			})),
		});
	}

	return {
		"@context": "https://schema.org",
		"@graph": graph,
	};
}

export function articlesIndexJsonLd(
	items: Array<{ slug: string; title: string }>,
) {
	const siteUrl = getSiteUrl();
	return {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: `Articles | ${SITE_NAME}`,
		description: `Guides on tailored resumes, ATS, and job search from ${SITE_NAME}.`,
		url: `${siteUrl}/articles`,
		isPartOf: {
			"@type": "WebSite",
			name: SITE_NAME,
			url: siteUrl,
		},
		mainEntity: {
			"@type": "ItemList",
			itemListElement: items.map((item, index) => ({
				"@type": "ListItem",
				position: index + 1,
				url: `${siteUrl}/articles/${item.slug}`,
				name: item.title,
			})),
		},
	};
}
