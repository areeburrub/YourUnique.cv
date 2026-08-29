import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import NextTopLoader from "nextjs-toploader";

import { DeferredMetrics } from "@/components/deferred-metrics";
import { ThemeProvider } from "@/components/theme-provider";
import { BRAND } from "@/lib/brand";
import { PRO_PRICE_USD, PRO_USAGE_MULTIPLIER } from "@/lib/plans";
import {
	ogImageAlt,
	ogImagePath,
	ogImageSize,
} from "@/lib/og-image";
import {
	getSiteUrl,
	SITE_DESCRIPTION,
	SITE_EMAIL,
	SITE_NAME,
	SITE_TAGLINE,
} from "@/lib/site";

import "./globals.css";

const inter = Inter({
	variable: "--font-body",
	subsets: ["latin"],
	display: "swap",
});

const interTight = Inter_Tight({
	variable: "--font-display",
	subsets: ["latin"],
	display: "swap",
	preload: true,
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
	title: {
		default: `${SITE_NAME} | ${SITE_TAGLINE}`,
		template: `%s | ${SITE_NAME}`,
	},
	description: SITE_DESCRIPTION,
	applicationName: SITE_NAME,
	authors: [{ name: SITE_NAME, url: siteUrl }],
	creator: SITE_NAME,
	publisher: SITE_NAME,
	category: "productivity",
	keywords: [
		"free tools",
		"ATS resume checker",
		"resume keyword extractor",
		"resume job match",
		"resume builder",
		"AI resume",
		"tailored CV",
		"job description resume",
		"career persona",
		"resume PDF",
		"your unique cv",
		"Your Unique CV",
		"your unique.cv",
		"Your Unique.cv",
		"yourunique.cv",
		"YourUnique.cv",
		"YourUnique CV",
		"your unique",
	],
	alternates: {
		canonical: "/",
		types: {
			"text/plain": [
				{ url: "/llms.txt", title: "llms.txt" },
				{ url: "/llm.txt", title: "llm.txt" },
			],
		},
	},
	openGraph: {
		type: "website",
		locale: "en_US",
		url: siteUrl,
		siteName: SITE_NAME,
		title: `${SITE_NAME} | ${SITE_TAGLINE}`,
		description: SITE_DESCRIPTION,
		images: [
			{
				url: ogImagePath,
				width: ogImageSize.width,
				height: ogImageSize.height,
				alt: ogImageAlt,
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: `${SITE_NAME} | ${SITE_TAGLINE}`,
		description: SITE_DESCRIPTION,
		images: [ogImagePath],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-image-preview": "large",
			"max-snippet": -1,
			"max-video-preview": -1,
		},
	},
	formatDetection: {
		email: false,
		telephone: false,
	},
	icons: {
		icon: [
			{ url: "/favicon.svg", type: "image/svg+xml" },
			{ url: "/icon-192.png", sizes: "192x192", type: "image/png" },
			{ url: "/icon-512.png", sizes: "512x512", type: "image/png" },
		],
		apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	interactiveWidget: "resizes-content",
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: BRAND.cream },
		{ media: "(prefers-color-scheme: dark)", color: BRAND.charcoal },
	],
};

const jsonLd = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "WebSite",
			name: SITE_NAME,
			alternateName: [
				"Your Unique CV",
				"your unique cv",
				"your unique.cv",
			],
			url: siteUrl,
			description: SITE_DESCRIPTION,
		},
		{
			"@type": "SoftwareApplication",
			name: SITE_NAME,
			alternateName: [
				"Your Unique CV",
				"your unique cv",
				"your unique.cv",
			],
			applicationCategory: "BusinessApplication",
			operatingSystem: "Web",
			url: siteUrl,
			description: SITE_DESCRIPTION,
			offers: [
				{
					"@type": "Offer",
					price: "0",
					priceCurrency: "USD",
					name: "Free",
					description: "Free forever. Tailor a few CVs each month, no card required",
				},
				{
					"@type": "Offer",
					price: String(PRO_PRICE_USD),
					priceCurrency: "USD",
					name: "Pro",
					description: `$${PRO_PRICE_USD} per month. About ${PRO_USAGE_MULTIPLIER}x more usage than Free`,
				},
			],
		},
		{
			"@type": "Organization",
			name: SITE_NAME,
			alternateName: [
				"Your Unique CV",
				"your unique cv",
				"your unique.cv",
			],
			url: siteUrl,
			email: SITE_EMAIL,
			logo: `${siteUrl}/logo.svg`,
		},
	],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={`${inter.variable} ${interTight.variable} h-full antialiased`}
		>
			<body className="flex min-h-full flex-col font-sans">
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
				/>
				<NextTopLoader
					color={BRAND.terracotta}
					height={2}
					showSpinner={false}
					shadow={false}
				/>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					{children}
					<DeferredMetrics />
				</ThemeProvider>
			</body>
		</html>
	);
}
