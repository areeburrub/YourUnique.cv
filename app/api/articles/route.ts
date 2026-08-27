import { revalidateArticlePages } from "@/lib/article-cache";
import {
	articlePatchSchema,
	articleWriteSchema,
	serializeArticle,
} from "@/lib/articles";
import {
	authorizeArticlesRequest,
	unauthorizedArticlesResponse,
} from "@/lib/articles-auth";
import {
	createArticle,
	getArticleBySlug,
	listArticles,
} from "@/lib/db/articles";

export const runtime = "nodejs";

function parsePublishedAt(value: string | null | undefined) {
	if (value === undefined) {
		return undefined;
	}
	if (value === null) {
		return null;
	}
	return new Date(value);
}

export async function GET(request: Request) {
	if (!authorizeArticlesRequest(request)) {
		return unauthorizedArticlesResponse();
	}

	const rows = await listArticles();
	return Response.json({ articles: rows.map(serializeArticle) });
}

export async function POST(request: Request) {
	if (!authorizeArticlesRequest(request)) {
		return unauthorizedArticlesResponse();
	}

	let json: unknown;
	try {
		json = await request.json();
	} catch {
		return Response.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	const parsed = articleWriteSchema.safeParse(json);
	if (!parsed.success) {
		return Response.json(
			{ error: "Invalid article", issues: parsed.error.flatten() },
			{ status: 400 },
		);
	}

	const existing = await getArticleBySlug(parsed.data.slug);
	if (existing) {
		return Response.json(
			{ error: `Article already exists: ${parsed.data.slug}` },
			{ status: 409 },
		);
	}

	const article = await createArticle({
		...parsed.data,
		publishedAt: parsePublishedAt(parsed.data.publishedAt),
	});

	if (!article) {
		return Response.json({ error: "Failed to create article" }, { status: 500 });
	}

	revalidateArticlePages(article.slug);

	return Response.json({ article: serializeArticle(article) }, { status: 201 });
}
