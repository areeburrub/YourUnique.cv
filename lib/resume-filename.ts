const RESUME_FILE_TZ = "Asia/Kolkata";

export function personNameFromResumeDocument(
	document: Record<string, unknown> | null | undefined,
) {
	const name = document?.name;
	return typeof name === "string" ? name.trim() : "";
}

export function formatResumeFileTimestamp(at = new Date()) {
	const parts = new Intl.DateTimeFormat("en-GB", {
		timeZone: RESUME_FILE_TZ,
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
		hourCycle: "h23",
	}).formatToParts(at);
	const value = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((part) => part.type === type)?.value ?? "";
	return `${pad2(value("day"))}${pad2(value("month"))}${value("year")}${pad2(value("hour"))}${pad2(value("minute"))}`;
}

export function resumeExportFilename(input: {
	personName?: string | null;
	at?: Date | null;
	extension?: "pdf" | "png";
}) {
	const stamp = formatResumeFileTimestamp(input.at ?? new Date());
	const person = sanitizeResumePersonName(input.personName);
	const extension = input.extension ?? "pdf";
	if (!person) {
		return `Resume - ${stamp}.${extension}`;
	}
	return `${person} - Resume - ${stamp}.${extension}`;
}

export function resumeContentDisposition(
	filename: string,
	asDownload: boolean,
) {
	const safe = filename
		.replaceAll('"', "")
		.replaceAll("\r", "")
		.replaceAll("\n", "");
	const encoded = encodeURIComponent(safe).replaceAll(/['()*]/g, (char) => {
		return `%${char.charCodeAt(0).toString(16).toUpperCase()}`;
	});
	const kind = asDownload ? "attachment" : "inline";
	return `${kind}; filename="${safe}"; filename*=UTF-8''${encoded}`;
}

function sanitizeResumePersonName(name: string | null | undefined) {
	if (!name) {
		return "";
	}
	return name
		.replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "")
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, 80);
}

function pad2(value: string) {
	return value.replace(/\D/g, "").padStart(2, "0").slice(-2);
}
