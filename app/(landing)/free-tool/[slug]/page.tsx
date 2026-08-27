import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ToolPageBody } from "@/components/tools/tool-page-body";
import { TOOL_SLUGS, TOOLS, isToolSlug } from "@/lib/tools/catalog";
import { toolJsonLd } from "@/lib/tools/jsonld";
import { SITE_NAME } from "@/lib/site";

export const dynamic = "force-static";
export const dynamicParams = false;

type ToolRouteProps = {
	params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
	return TOOL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
	params,
}: ToolRouteProps): Promise<Metadata> {
	const { slug } = await params;
	if (!isToolSlug(slug)) {
		return {
			title: "Free Tool not found",
			robots: { index: false, follow: false },
		};
	}

	const tool = TOOLS[slug];
	return {
		title: tool.seoTitle,
		description: tool.description,
		keywords: tool.keywords,
		alternates: {
			canonical: tool.path,
		},
		openGraph: {
			type: "website",
			title: `${tool.seoTitle} | ${SITE_NAME}`,
			description: tool.description,
			url: tool.path,
		},
		twitter: {
			card: "summary_large_image",
			title: `${tool.seoTitle} | ${SITE_NAME}`,
			description: tool.description,
		},
	};
}

export default async function ToolPage({ params }: ToolRouteProps) {
	const { slug } = await params;
	if (!isToolSlug(slug)) {
		notFound();
	}

	const tool = TOOLS[slug];
	return (
		<ToolPageBody
			tool={tool}
			jsonLd={toolJsonLd(tool)}
			turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? ""}
		/>
	);
}
