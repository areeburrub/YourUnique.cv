import type { MetadataRoute } from "next";

import { BRAND } from "@/lib/brand";
import {
	SITE_DESCRIPTION,
	SITE_NAME,
	SITE_SHORT_NAME,
} from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: SITE_NAME,
		short_name: SITE_SHORT_NAME,
		description: SITE_DESCRIPTION,
		start_url: "/",
		display: "standalone",
		background_color: BRAND.cream,
		theme_color: BRAND.terracotta,
		icons: [
			{
				src: "/favicon.svg",
				sizes: "any",
				type: "image/svg+xml",
			},
			{
				src: "/icon-192.png",
				sizes: "192x192",
				type: "image/png",
			},
			{
				src: "/icon-512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
			{
				src: "/apple-touch-icon.png",
				sizes: "180x180",
				type: "image/png",
			},
		],
	};
}
