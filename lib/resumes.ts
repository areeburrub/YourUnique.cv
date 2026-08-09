import type { ResumeRow } from "@/lib/db/resumes";

export type ResumeListItem = {
	id: string;
	name: string;
	compileStatus: ResumeRow["compileStatus"];
	compileError: string | null;
	compiledAt: string | null;
	updatedAt: string;
	hasPdf: boolean;
};

export function toResumeListItem(row: ResumeRow): ResumeListItem {
	return {
		id: row.id,
		name: row.name,
		compileStatus: row.compileStatus,
		compileError: row.compileError,
		compiledAt: row.compiledAt?.toISOString() ?? null,
		updatedAt: row.updatedAt.toISOString(),
		hasPdf: Boolean(row.pdfFileId),
	};
}

export function resumeDownloadPath(resumeId: string, options?: { download?: boolean }) {
	const path = `/api/resumes/${resumeId}/download`;
	return options?.download ? `${path}?download=1` : path;
}

export function resumePreviewPath(resumeId: string) {
	return resumeDownloadPath(resumeId);
}

export function isResumeCompiling(status: ResumeListItem["compileStatus"]) {
	return status === "queued" || status === "compiling";
}
