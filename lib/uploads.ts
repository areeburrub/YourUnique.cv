export const MAX_UPLOAD_FILES = 5;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const ALLOWED_UPLOAD_MEDIA_TYPES = new Set([
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	"text/plain",
	"text/markdown",
]);

export const ONBOARDING_UPLOAD_MEDIA_TYPES = new Set([
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"application/pdf",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	"text/plain",
	"text/markdown",
]);

export const UPLOAD_ACCEPT =
	"image/jpeg,image/png,image/gif,image/webp,application/pdf,.pdf,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,application/vnd.openxmlformats-officedocument.presentationml.presentation,.pptx,text/plain,.txt,text/markdown,.md";

export const ONBOARDING_UPLOAD_ACCEPT =
	"image/jpeg,image/png,image/gif,image/webp,application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,application/vnd.openxmlformats-officedocument.presentationml.presentation,.pptx,text/plain,.txt,text/markdown,.md";

const EXTENSION_MEDIA_TYPES: Record<string, string> = {
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".gif": "image/gif",
	".webp": "image/webp",
	".pdf": "application/pdf",
	".doc": "application/msword",
	".docx":
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	".pptx":
		"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	".txt": "text/plain",
	".md": "text/markdown",
	".markdown": "text/markdown",
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
	const match = url.match(/^\/api\/files\/([^/?#]+)$/);
	return match?.[1] ?? null;
}

export function sanitizeFilename(filename: string) {
	const cleaned = filename.replace(/[^\w.\- ()[\]]+/g, "_").trim();
	return cleaned.slice(0, 180) || "file";
}
