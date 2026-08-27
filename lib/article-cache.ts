import { revalidatePath } from "next/cache";

import { articleMarkdownPath, articlePath } from "@/lib/articles";

export function revalidateArticlePages(slug: string, previousSlug?: string) {
	revalidatePath("/articles");
	revalidatePath(articlePath(slug));
	revalidatePath(articleMarkdownPath(slug));
	revalidatePath("/sitemap.xml");
	revalidatePath("/llms.txt");

	if (previousSlug && previousSlug !== slug) {
		revalidatePath(articlePath(previousSlug));
		revalidatePath(articleMarkdownPath(previousSlug));
	}
}
