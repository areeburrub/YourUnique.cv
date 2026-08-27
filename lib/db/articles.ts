import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "@/lib/db";
import { type ArticleFaq, articles } from "@/lib/db/schema";

export type ArticleRow = typeof articles.$inferSelect;

export type ArticleWriteInput = {
	slug: string;
	title: string;
	description: string;
	content: string;
	coverImageUrl: string;
	coverImageAlt: string;
	authorName?: string;
	authorUrl?: string | null;
	seoTitle?: string | null;
	tldr?: string | null;
	category?: string | null;
	keywords?: string[];
	faq?: ArticleFaq[];
	featured?: boolean;
	published?: boolean;
	publishedAt?: Date | null;
};

export type ArticlePatchInput = Partial<ArticleWriteInput>;

function publishedAtForWrite(input: {
	published: boolean;
	publishedAt?: Date | null;
	previousPublishedAt?: Date | null;
}) {
	if (!input.published) {
		return input.publishedAt === undefined
			? (input.previousPublishedAt ?? null)
			: input.publishedAt;
	}
	if (input.publishedAt) {
		return input.publishedAt;
	}
	return input.previousPublishedAt ?? new Date();
}

export async function listArticles() {
	return db.query.articles.findMany({
		orderBy: [desc(articles.updatedAt)],
	});
}

export async function listPublishedArticles() {
	return db.query.articles.findMany({
		where: eq(articles.published, true),
		orderBy: [desc(articles.publishedAt), desc(articles.updatedAt)],
	});
}

export async function listFeaturedArticles() {
	return db.query.articles.findMany({
		where: and(eq(articles.published, true), eq(articles.featured, true)),
		orderBy: [desc(articles.publishedAt), desc(articles.updatedAt)],
	});
}

export async function listPublishedArticleSlugs() {
	const rows = await db
		.select({ slug: articles.slug })
		.from(articles)
		.where(eq(articles.published, true));
	return rows.map((row) => row.slug);
}

export async function getArticleBySlug(slug: string) {
	return db.query.articles.findFirst({
		where: eq(articles.slug, slug),
	});
}

export async function getPublishedArticleBySlug(slug: string) {
	return db.query.articles.findFirst({
		where: and(eq(articles.slug, slug), eq(articles.published, true)),
	});
}

export async function createArticle(input: ArticleWriteInput) {
	const published = input.published ?? false;
	const [row] = await db
		.insert(articles)
		.values({
			id: nanoid(),
			slug: input.slug,
			title: input.title,
			description: input.description,
			content: input.content,
			coverImageUrl: input.coverImageUrl,
			coverImageAlt: input.coverImageAlt,
			authorName: input.authorName ?? "Areeb ur Rub",
			authorUrl: input.authorUrl ?? null,
			seoTitle: input.seoTitle ?? null,
			tldr: input.tldr ?? null,
			category: input.category ?? null,
			keywords: input.keywords ?? [],
			faq: input.faq ?? [],
			featured: input.featured ?? false,
			published,
			publishedAt: publishedAtForWrite({
				published,
				publishedAt: input.publishedAt,
			}),
		})
		.returning();
	return row;
}

export async function updateArticleBySlug(slug: string, input: ArticlePatchInput) {
	const existing = await getArticleBySlug(slug);
	if (!existing) {
		return null;
	}

	const published = input.published ?? existing.published;
	const [row] = await db
		.update(articles)
		.set({
			...(input.slug !== undefined ? { slug: input.slug } : {}),
			...(input.title !== undefined ? { title: input.title } : {}),
			...(input.description !== undefined
				? { description: input.description }
				: {}),
			...(input.content !== undefined ? { content: input.content } : {}),
			...(input.coverImageUrl !== undefined
				? { coverImageUrl: input.coverImageUrl }
				: {}),
			...(input.coverImageAlt !== undefined
				? { coverImageAlt: input.coverImageAlt }
				: {}),
			...(input.authorName !== undefined
				? { authorName: input.authorName }
				: {}),
			...(input.authorUrl !== undefined ? { authorUrl: input.authorUrl } : {}),
			...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
			...(input.tldr !== undefined ? { tldr: input.tldr } : {}),
			...(input.category !== undefined ? { category: input.category } : {}),
			...(input.keywords !== undefined ? { keywords: input.keywords } : {}),
			...(input.faq !== undefined ? { faq: input.faq } : {}),
			...(input.featured !== undefined ? { featured: input.featured } : {}),
			...(input.published !== undefined ? { published } : {}),
			publishedAt: publishedAtForWrite({
				published,
				publishedAt: input.publishedAt,
				previousPublishedAt: existing.publishedAt,
			}),
			updatedAt: new Date(),
		})
		.where(eq(articles.id, existing.id))
		.returning();

	return row ?? null;
}

export async function deleteArticleBySlug(slug: string) {
	const [row] = await db
		.delete(articles)
		.where(eq(articles.slug, slug))
		.returning({ slug: articles.slug });
	return row ?? null;
}
