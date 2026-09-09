import type { MetadataRoute } from "next";

import { listPublishedArticles } from "@/lib/db/articles";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const siteUrl = getSiteUrl();

	const staticRoutes: MetadataRoute.Sitemap = [
		{
			url: siteUrl,
			changeFrequency: "weekly",
			priority: 1,
		},
		{
			url: `${siteUrl}/articles`,
			changeFrequency: "weekly",
			priority: 0.8,
		},
		{
			url: `${siteUrl}/free-tools`,
			changeFrequency: "weekly",
			priority: 0.9,
		},
		{
			url: `${siteUrl}/free-tools/ats-resume-checker`,
			changeFrequency: "monthly",
			priority: 0.9,
		},
		{
			url: `${siteUrl}/free-tools/job-description-keyword-extractor`,
			changeFrequency: "monthly",
			priority: 0.9,
		},
		{
			url: `${siteUrl}/free-tools/resume-job-match`,
			changeFrequency: "monthly",
			priority: 0.9,
		},
		{
			url: `${siteUrl}/templates`,
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: `${siteUrl}/terms`,
			changeFrequency: "yearly",
			priority: 0.3,
		},
		{
			url: `${siteUrl}/privacy`,
			changeFrequency: "yearly",
			priority: 0.3,
		},
		{
			url: `${siteUrl}/sign-up`,
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: `${siteUrl}/sign-in`,
			changeFrequency: "monthly",
			priority: 0.5,
		},
		{
			url: `${siteUrl}/llms.txt`,
			changeFrequency: "weekly",
			priority: 0.4,
		},
	];

	try {
		const articles = await listPublishedArticles();
		const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
			url: `${siteUrl}/articles/${article.slug}`,
			lastModified: article.updatedAt,
			changeFrequency: "monthly",
			priority: article.featured ? 0.8 : 0.6,
		}));
		return [...staticRoutes, ...articleRoutes];
	} catch {
		return staticRoutes;
	}
}
