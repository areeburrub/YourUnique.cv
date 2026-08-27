import { revalidatePath, revalidateTag } from "next/cache";

import { articleMarkdownPath, articlePath } from "@/lib/articles";

export function revalidateArticlePages(slug: string, previousSlug?: string) {
	revalidateTag("articles", "max");
	revalidatePath("/articles");
	revalidatePath("/articles/[slug]", "page");
	revalidatePath(articlePath(slug));
	revalidatePath(articleMarkdownPath(slug));
	revalidatePath("/sitemap.xml");
	revalidatePath("/llms.txt");

	if (previousSlug && previousSlug !== slug) {
		revalidatePath(articlePath(previousSlug));
		revalidatePath(articleMarkdownPath(previousSlug));
	}
}
