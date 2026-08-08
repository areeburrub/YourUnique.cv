export function fileTypeLabel(mediaType: string, filename?: string) {
	const fromName = filename?.split(".").pop()?.toUpperCase();
	if (mediaType === "application/pdf") {
		return "PDF";
	}
	if (
		mediaType ===
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	) {
		return "DOCX";
	}
	if (mediaType === "application/msword") {
		return "DOC";
	}
	if (mediaType.startsWith("image/")) {
		return (fromName || mediaType.replace("image/", "")).toUpperCase();
	}
	if (mediaType === "text/markdown") {
		return "MD";
	}
	if (mediaType === "text/plain") {
		return "TXT";
	}
	return (fromName || "FILE").toUpperCase();
}
