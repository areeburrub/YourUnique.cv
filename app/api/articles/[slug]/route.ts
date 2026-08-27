import { revalidateArticlePages } from "@/lib/article-cache";
import { articlePatchSchema, serializeArticle } from "@/lib/articles";
import {
	authorizeArticlesRequest,
	unauthorizedArticlesResponse,
} from "@/lib/articles-auth";
import {
	deleteArticleBySlug,
	getArticleBySlug,
	updateArticleBySlug,
} from "@/lib/db/articles";

export const runtime = "nodejs";

type RouteContext = {
	params: Promise<{ slug: string }>;
};

function parsePublishedAt(value: string | null | undefined) {
	if (value === undefined) {
		return undefined;
	}
	if (value === null) {
		return null;
	}
	return new Date(value);
}

export async function GET(request: Request, { params }: RouteContext) {
	if (!authorizeArticlesRequest(request)) {
		return unauthorizedArticlesResponse();
	}

	const { slug } = await params;
	const article = await getArticleBySlug(slug);
	if (!article) {
		return Response.json({ error: "Article not found" }, { status: 404 });
	}

	return Response.json({ article: serializeArticle(article) });
}

export async function PUT(request: Request, { params }: RouteContext) {
	if (!authorizeArticlesRequest(request)) {
		return unauthorizedArticlesResponse();
	}

	const { slug } = await params;

	let json: unknown;
	try {
		json = await request.json();
	} catch {
		return Response.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	const parsed = articlePatchSchema.safeParse(json);
	if (!parsed.success) {
		return Response.json(
			{ error: "Invalid article", issues: parsed.error.flatten() },
			{ status: 400 },
		);
	}

	if (parsed.data.slug && parsed.data.slug !== slug) {
		const taken = await getArticleBySlug(parsed.data.slug);
		if (taken) {
			return Response.json(
				{ error: `Article already exists: ${parsed.data.slug}` },
				{ status: 409 },
			);
		}
	}

	const article = await updateArticleBySlug(slug, {
		...parsed.data,
		publishedAt: parsePublishedAt(parsed.data.publishedAt),
	});

	if (!article) {
		return Response.json({ error: "Article not found" }, { status: 404 });
	}

	revalidateArticlePages(article.slug, slug);

	return Response.json({ article: serializeArticle(article) });
}

export async function PATCH(request: Request, { params }: RouteContext) {
	return PUT(request, { params });
}

export async function DELETE(request: Request, { params }: RouteContext) {
	if (!authorizeArticlesRequest(request)) {
		return unauthorizedArticlesResponse();
	}

	const { slug } = await params;
	const deleted = await deleteArticleBySlug(slug);
	if (!deleted) {
		return Response.json({ error: "Article not found" }, { status: 404 });
	}

	revalidateArticlePages(slug);

	return Response.json({ ok: true, slug });
}
