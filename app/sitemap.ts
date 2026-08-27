import type { MetadataRoute } from "next";

import { listPublishedArticles } from "@/lib/db/articles";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const siteUrl = getSiteUrl();

	const staticRoutes: MetadataRoute.Sitemap = [
		{
			url: siteUrl,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 1,
		},
		{
			url: `${siteUrl}/articles`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		},
		{
			url: `${siteUrl}/free-tool`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.9,
		},
		{
			url: `${siteUrl}/free-tool/ats-resume-checker`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.9,
		},
		{
			url: `${siteUrl}/free-tool/job-description-keyword-extractor`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.9,
		},
		{
			url: `${siteUrl}/free-tool/resume-job-match`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.9,
		},
		{
			url: `${siteUrl}/templates`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: `${siteUrl}/terms`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 0.3,
		},
		{
			url: `${siteUrl}/privacy`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 0.3,
		},
		{
			url: `${siteUrl}/sign-up`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: `${siteUrl}/sign-in`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.5,
		},
		{
			url: `${siteUrl}/llms.txt`,
			lastModified: new Date(),
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
