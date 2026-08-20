export const MAX_UPLOAD_FILES = 5;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const ALLOWED_UPLOAD_MEDIA_TYPES = new Set([
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"application/pdf",
]);

export const ONBOARDING_UPLOAD_MEDIA_TYPES = new Set(["application/pdf"]);

export const UPLOAD_ACCEPT =
	"image/jpeg,image/png,image/gif,image/webp,application/pdf,.pdf";

export const ONBOARDING_UPLOAD_ACCEPT = "application/pdf,.pdf";

const EXTENSION_MEDIA_TYPES: Record<string, string> = {
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".gif": "image/gif",
	".webp": "image/webp",
	".pdf": "application/pdf",
};

export function fileExtension(filename: string) {
	const trimmed = filename.trim().toLowerCase();
	const index = trimmed.lastIndexOf(".");
	if (index <= 0 || index === trimmed.length - 1) {
		return "";
	}
	return trimmed.slice(index);
}

export function mediaTypeFromFilename(filename: string) {
	return EXTENSION_MEDIA_TYPES[fileExtension(filename)] ?? "";
}

export function isAllowedUploadMediaType(mediaType: string) {
	return ALLOWED_UPLOAD_MEDIA_TYPES.has(mediaType);
}

export function isAllowedOnboardingUploadMediaType(mediaType: string) {
	return ONBOARDING_UPLOAD_MEDIA_TYPES.has(mediaType);
}

export function resolveUploadMediaType(input: {
	filename: string;
	mediaType?: string;
}) {
	const mediaType = input.mediaType?.trim();
	if (mediaType && isAllowedUploadMediaType(mediaType)) {
		return mediaType;
	}
	return mediaTypeFromFilename(input.filename);
}

export function fileAppUrl(fileId: string) {
	return `/api/files/${fileId}`;
}

export function parseFileIdFromAppUrl(url: string) {
	const match = url.match(/^\/api\/files\/([^/?#]+)(?:[?#].*)?$/);
	return match?.[1] ?? null;
}

export function sanitizeFilename(filename: string) {
	const cleaned = filename.replace(/[^\w.\- ()[\]]+/g, "_").trim();
	return cleaned.slice(0, 180) || "file";
}
