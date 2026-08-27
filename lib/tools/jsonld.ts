import type { ToolDefinition } from "@/lib/tools/catalog";
import { FREE_TOOL_NAME, FREE_TOOL_PATH, TOOL_LIST } from "@/lib/tools/catalog";
import { getSiteUrl, SITE_NAME } from "@/lib/site";

export function toolJsonLd(tool: ToolDefinition) {
	const siteUrl = getSiteUrl();
	const url = `${siteUrl}${tool.path}`;

	return {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "WebApplication",
				"@id": `${url}#app`,
				name: tool.name,
				url,
				applicationCategory: "BusinessApplication",
				operatingSystem: "Web",
				isAccessibleForFree: true,
				description: tool.description,
				offers: {
					"@type": "Offer",
					price: "0",
					priceCurrency: "USD",
				},
				publisher: {
					"@type": "Organization",
					name: SITE_NAME,
					url: siteUrl,
				},
			},
			{
				"@type": "HowTo",
				"@id": `${url}#howto`,
				name: tool.howToName,
				description: tool.description,
				step: tool.steps.map((name, index) => ({
					"@type": "HowToStep",
					position: index + 1,
					name,
				})),
			},
			{
				"@type": "FAQPage",
				"@id": `${url}#faq`,
				mainEntity: tool.faq.map((item) => ({
					"@type": "Question",
					name: item.question,
					acceptedAnswer: {
						"@type": "Answer",
						text: item.answer,
					},
				})),
			},
			{
				"@type": "BreadcrumbList",
				itemListElement: [
					{
						"@type": "ListItem",
						position: 1,
						name: "Home",
						item: siteUrl,
					},
					{
						"@type": "ListItem",
						position: 2,
						name: FREE_TOOL_NAME,
						item: `${siteUrl}${FREE_TOOL_PATH}`,
					},
					{
						"@type": "ListItem",
						position: 3,
						name: tool.name,
						item: url,
					},
				],
			},
		],
	};
}

export function toolsIndexJsonLd() {
	const siteUrl = getSiteUrl();
	return {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: `${FREE_TOOL_NAME} | ${SITE_NAME}`,
		description: `Free Tools: ATS checker, job-description keyword extractor, and resume vs job match from ${SITE_NAME}.`,
		url: `${siteUrl}${FREE_TOOL_PATH}`,
		isPartOf: {
			"@type": "WebSite",
			name: SITE_NAME,
			url: siteUrl,
		},
		mainEntity: {
			"@type": "ItemList",
			itemListElement: TOOL_LIST.map((tool, index) => ({
				"@type": "ListItem",
				position: index + 1,
				url: `${siteUrl}${tool.path}`,
				name: tool.name,
			})),
		},
	};
}
