import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ui } from "@clerk/ui";
import { Inter, Inter_Tight } from "next/font/google";
import NextTopLoader from "nextjs-toploader";

import { ThemeProvider } from "@/components/theme-provider";
import { BRAND } from "@/lib/brand";
import { clerkAppearance } from "@/lib/clerk-appearance";
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
});

const interTight = Inter_Tight({
	variable: "--font-display",
	subsets: ["latin"],
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
		"resume builder",
		"AI resume",
		"tailored CV",
		"job description resume",
		"career persona",
		"resume PDF",
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
			url: siteUrl,
			description: SITE_DESCRIPTION,
		},
		{
			"@type": "SoftwareApplication",
			name: SITE_NAME,
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
				},
				{
					"@type": "Offer",
					price: "10",
					priceCurrency: "USD",
					name: "Pro",
				},
			],
		},
		{
			"@type": "Organization",
			name: SITE_NAME,
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
					<ClerkProvider
						ui={ui}
						appearance={clerkAppearance}
						signInUrl="/sign-in"
						signUpUrl="/sign-up"
						signInFallbackRedirectUrl="/onboarding"
						signUpFallbackRedirectUrl="/onboarding"
					>
						{children}
					</ClerkProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
