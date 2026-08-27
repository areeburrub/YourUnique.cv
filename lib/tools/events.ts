import type { ToolRunResult } from "@/lib/tools/schemas";

export type ToolStatusEvent = {
	type: "status";
	id: string;
	label: string;
};

export type ToolResultEvent = {
	type: "result";
	result: ToolRunResult;
};

export type ToolErrorEvent = {
	type: "error";
	error: string;
};

export type ToolStreamEvent =
	| ToolStatusEvent
	| ToolResultEvent
	| ToolErrorEvent;

export function analyzeStatusLabel(tool: string) {
	if (tool === "ats-resume-checker") {
		return "Scoring your resume against this job";
	}
	if (tool === "job-description-keyword-extractor") {
		return "Extracting keywords from the posting";
	}
	return "Checking how well you match this job";
}
