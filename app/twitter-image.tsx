import {
	createOgImage,
	ogImageAlt,
	ogImageContentType,
	ogImageSize,
} from "@/lib/og-image";

export const alt = ogImageAlt;
export const size = ogImageSize;
export const contentType = ogImageContentType;
export const revalidate = 86400;

export default function TwitterImage() {
	return createOgImage();
}
