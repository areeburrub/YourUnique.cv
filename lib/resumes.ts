import type { ResumeRow } from "@/lib/db/resumes";
import { fileAppUrl } from "@/lib/uploads";

export type ResumeListItem = {
	id: string;
	name: string;
	companyName: string | null;
	roleTitle: string | null;
	jobLink: string | null;
	compileStatus: ResumeRow["compileStatus"];
	compileError: string | null;
	compiledAt: string | null;
	createdAt: string;
	updatedAt: string;
	hasPdf: boolean;
	previewUrl: string | null;
};

export function toResumeListItem(row: ResumeRow): ResumeListItem {
	return {
		id: row.id,
		name: row.name,
		companyName: row.companyName,
		roleTitle: row.roleTitle,
		jobLink: row.jobLink,
		compileStatus: row.compileStatus,
		compileError: row.compileError,
		compiledAt: row.compiledAt?.toISOString() ?? null,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
		hasPdf: Boolean(row.pdfFileId),
		previewUrl: row.previewFileId ? fileAppUrl(row.previewFileId) : null,
	};
}

export function resumeDownloadPath(
	resumeId: string,
	options?: { download?: boolean },
) {
	const path = `/api/resumes/${resumeId}/download`;
	return options?.download ? `${path}?download=1` : path;
}

export function resumePreviewPath(resumeId: string) {
	return resumeDownloadPath(resumeId);
}

export const RESUME_PDF_CARD_TOOLS = [
	"create_resume",
	"update_resume_document",
	"compile_resume",
	"get_resume_download",
] as const;

export function isResumePdfCardTool(name: string) {
	return (RESUME_PDF_CARD_TOOLS as readonly string[]).includes(name);
}

export function resumeIdFromDownloadUrl(url: string) {
	const match = url.match(/\/api\/resumes\/([^/?#]+)\/download/);
	return match?.[1] ?? null;
}

export function isResumeCompiling(status: ResumeListItem["compileStatus"]) {
	return status === "queued" || status === "compiling";
}

export const resumeStatusKey = (id: string) => ["resume-status", id] as const;

export function resumeDateGroupKey(iso: string) {
	const date = new Date(iso);
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function formatResumeDateGroupLabel(iso: string) {
	const date = new Date(iso);
	const now = new Date();
	const startOfToday = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
	);
	const startOfThatDay = new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
	);
	const dayDiff = Math.round(
		(startOfToday.getTime() - startOfThatDay.getTime()) / 86_400_000,
	);

	if (dayDiff === 0) {
		return "Today";
	}
	if (dayDiff === 1) {
		return "Yesterday";
	}
	if (dayDiff < 7) {
		return date.toLocaleDateString(undefined, { weekday: "long" });
	}
	return date.toLocaleDateString(undefined, {
		weekday: "short",
		month: "short",
		day: "numeric",
		year:
			date.getFullYear() === now.getFullYear() ? undefined : "numeric",
	});
}

export function groupResumesByDate(resumes: ResumeListItem[]) {
	const groups: Array<{ key: string; label: string; resumes: ResumeListItem[] }> =
		[];
	const indexByKey = new Map<string, number>();

	for (const resume of resumes) {
		const key = resumeDateGroupKey(resume.createdAt);
		const existing = indexByKey.get(key);
		if (existing === undefined) {
			indexByKey.set(key, groups.length);
			groups.push({
				key,
				label: formatResumeDateGroupLabel(resume.createdAt),
				resumes: [resume],
			});
		} else {
			groups[existing].resumes.push(resume);
		}
	}

	return groups;
}
