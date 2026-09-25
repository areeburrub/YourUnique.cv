import {
	createJobRadarOgImage,
	jobRadarOgImageAlt,
	ogImageContentType,
	ogImageSize,
} from "@/lib/og-image";

export const alt = jobRadarOgImageAlt;
export const size = ogImageSize;
export const contentType = ogImageContentType;
export const revalidate = 86400;

export default function JobRadarOpenGraphImage() {
	return createJobRadarOgImage();
}
