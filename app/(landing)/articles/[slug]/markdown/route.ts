import { notFound } from "next/navigation";

import { getPublishedArticleBySlug } from "@/lib/db/articles";
import { getSiteUrl, SITE_NAME } from "@/lib/site";

export const revalidate = 3600;
export const dynamicParams = true;

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ slug: string }> },
) {
	const { slug } = await params;
	const article = await getPublishedArticleBySlug(slug);
	if (!article) {
		notFound();
	}

	const siteUrl = getSiteUrl();
	const published = article.publishedAt ?? article.createdAt;
	const faqBlock =
		article.faq.length > 0
			? `\n\n## Questions\n\n${article.faq
					.map((item) => `### ${item.question}\n\n${item.answer}`)
					.join("\n\n")}`
			: "";

	const tldrBlock = article.tldr ? `\n> ${article.tldr}\n` : "";

	const body = `# ${article.title}

${article.description}
${tldrBlock}
Author: ${article.authorName}
Published: ${published.toISOString()}
Updated: ${article.updatedAt.toISOString()}
Canonical: ${siteUrl}/articles/${article.slug}

${article.content.trim()}${faqBlock}

— ${SITE_NAME}
`;

	return new Response(body, {
		headers: {
			"Content-Type": "text/markdown; charset=utf-8",
			"Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
		},
	});
}
