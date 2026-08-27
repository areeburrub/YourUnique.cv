import { cache } from "react";
import { z } from "zod";

import type { ArticleRow } from "@/lib/db/articles";
import {
	getPublishedArticleBySlug,
	listFeaturedArticles,
} from "@/lib/db/articles";
import type { ArticleFaq } from "@/lib/db/schema";

export const ARTICLE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const articleFaqSchema = z.object({
	question: z.string().trim().min(1).max(240),
	answer: z.string().trim().min(1).max(2000),
});

export const articleWriteSchema = z.object({
	slug: z
		.string()
		.trim()
		.min(1)
		.max(120)
		.regex(ARTICLE_SLUG_PATTERN, "Use lowercase letters, numbers, and hyphens"),
	title: z.string().trim().min(1).max(160),
	description: z.string().trim().min(1).max(320),
	content: z.string().trim().min(1).max(200_000),
	coverImageUrl: z.string().trim().min(1).max(2000),
	coverImageAlt: z.string().trim().min(1).max(240),
	authorName: z.string().trim().min(1).max(80).optional(),
	authorUrl: z.string().trim().url().max(500).nullable().optional(),
	seoTitle: z.string().trim().min(1).max(70).nullable().optional(),
	tldr: z.string().trim().min(1).max(600).nullable().optional(),
	category: z.string().trim().min(1).max(60).nullable().optional(),
	keywords: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
	faq: z.array(articleFaqSchema).max(20).optional(),
	featured: z.boolean().optional(),
	published: z.boolean().optional(),
	publishedAt: z.iso.datetime().nullable().optional(),
});

export const articlePatchSchema = articleWriteSchema.partial();

export type ArticleWriteBody = z.infer<typeof articleWriteSchema>;
export type ArticlePatchBody = z.infer<typeof articlePatchSchema>;

export type ArticleHeading = {
	id: string;
	text: string;
	level: 2 | 3;
};

const WORDS_PER_MINUTE = 200;

export function slugifyHeading(text: string) {
	return text
		.toLowerCase()
		.replace(/<[^>]+>/g, "")
		.replace(/[^a-z0-9\s-]/g, "")
		.trim()
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.slice(0, 80);
}

export function extractArticleHeadings(markdown: string): ArticleHeading[] {
	const headings: ArticleHeading[] = [];
	const used = new Map<string, number>();
	let inFence = false;

	for (const line of markdown.split("\n")) {
		const fence = line.trim().startsWith("```");
		if (fence) {
			inFence = !inFence;
			continue;
		}
		if (inFence) {
			continue;
		}

		const match = /^(#{2,3})\s+(.+)$/.exec(line.trim());
		if (!match?.[1] || !match[2]) {
			continue;
		}

		const text = match[2].replace(/[*_`]/g, "").trim();
		if (!text) {
			continue;
		}

		const base = slugifyHeading(text) || "section";
		const count = used.get(base) ?? 0;
		used.set(base, count + 1);
		const id = count === 0 ? base : `${base}-${count + 1}`;

		headings.push({
			id,
			text,
			level: match[1].length === 2 ? 2 : 3,
		});
	}

	return headings;
}

export function readingTimeMinutes(markdown: string) {
	const words = markdown.trim().split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function formatArticleDate(date: Date) {
	return new Intl.DateTimeFormat("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
		timeZone: "UTC",
	}).format(date);
}

export function articlePath(slug: string) {
	return `/articles/${slug}`;
}

export function articleMarkdownPath(slug: string) {
	return `/articles/${slug}/markdown`;
}

export function serializeArticle(row: ArticleRow) {
	return {
		id: row.id,
		slug: row.slug,
		title: row.title,
		description: row.description,
		content: row.content,
		coverImageUrl: row.coverImageUrl,
		coverImageAlt: row.coverImageAlt,
		authorName: row.authorName,
		authorUrl: row.authorUrl,
		seoTitle: row.seoTitle,
		tldr: row.tldr,
		category: row.category,
		keywords: row.keywords,
		faq: row.faq as ArticleFaq[],
		featured: row.featured,
		published: row.published,
		publishedAt: row.publishedAt?.toISOString() ?? null,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

export const getCachedPublishedArticle = cache(async (slug: string) => {
	return getPublishedArticleBySlug(slug);
});

export const getCachedFeaturedArticles = cache(async () => {
	return listFeaturedArticles();
});
