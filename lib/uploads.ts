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
	"text/plain",
	"text/markdown",
]);

export const UPLOAD_ACCEPT =
	"image/jpeg,image/png,image/gif,image/webp,application/pdf,.doc,.docx,text/plain,text/markdown,.md";

export function isAllowedUploadMediaType(mediaType: string) {
	return ALLOWED_UPLOAD_MEDIA_TYPES.has(mediaType);
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
