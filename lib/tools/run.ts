import { generateText, Output, type FilePart, type TextPart } from "ai";
import type { z } from "zod";

import { OPENROUTER_TOOLS_MODEL, openrouter } from "@/lib/ai/openrouter";
import type { ToolSlug } from "@/lib/tools/catalog";
import { JOB_CHAR_LIMIT } from "@/lib/tools/constants";
import {
	scanResumePdf,
	type ScannedResume,
} from "@/lib/tools/extract-resume-pdf";
import {
	atsResultSchema,
	keywordsResultSchema,
	matchResultSchema,
	type ToolRunResult,
} from "@/lib/tools/schemas";

const SHARED_RULES = `Use only the resume and job text. Never invent jobs, skills, tools, or metrics. Prefer short labels. If a skill is not in the resume, it is missing.`;

function clip(text: string, max: number) {
	const trimmed = text.trim();
	if (trimmed.length <= max) {
		return trimmed;
	}
	return `${trimmed.slice(0, max)}\n[truncated]`;
}

function toolsModel() {
	return openrouter(OPENROUTER_TOOLS_MODEL);
}

async function generateToolObject<T>(input: {
	schema: z.ZodType<T>;
	maxOutputTokens: number;
	instructions: string;
	resume: ScannedResume | { kind: "none" };
	job: string;
}): Promise<T> {
	const job = `JOB:\n${input.job}`;
	const base = {
		model: toolsModel(),
		output: Output.object({ schema: input.schema }),
		maxOutputTokens: input.maxOutputTokens,
		temperature: 0,
		instructions: input.instructions,
	};

	if (input.resume.kind === "none") {
		const { output } = await generateText({
			...base,
			prompt: `${job}\n\nRESUME: (none)`,
		});
		if (!output) {
			throw new Error("empty_tool_output");
		}
		return output;
	}

	if (input.resume.kind === "text") {
		const { output } = await generateText({
			...base,
			prompt: `RESUME:\n${input.resume.text}\n\n${job}`,
		});
		if (!output) {
			throw new Error("empty_tool_output");
		}
		return output;
	}

	const parts: Array<TextPart | FilePart> = [
		{
			type: "text",
			text: `Scan the attached resume PDF. ${job}${
				input.resume.links ? `\n\n${input.resume.links}` : ""
			}`,
		},
		{
			type: "file",
			mediaType: "application/pdf",
			filename: input.resume.filename,
			data: input.resume.bytes,
		},
	];

	const { output } = await generateText({
		...base,
		messages: [{ role: "user", content: parts }],
	});
	if (!output) {
		throw new Error("empty_tool_output");
	}
	return output;
}

export async function runPublicTool(input: {
	tool: ToolSlug;
	jobText: string;
	resumePdf?: { filename: string; bytes: Uint8Array };
}): Promise<ToolRunResult> {
	const job = clip(input.jobText, JOB_CHAR_LIMIT);
	const resume: ScannedResume | { kind: "none" } = input.resumePdf
		? await scanResumePdf(input.resumePdf)
		: { kind: "none" };

	if (input.tool === "ats-resume-checker") {
		const data = await generateToolObject({
			schema: atsResultSchema,
			maxOutputTokens: 420,
			instructions: `${SHARED_RULES}
Score this resume vs this JD (0-100). Areas: keywords, skills, tools, seniority, evidence. Verdict: one short sentence.`,
			resume,
			job,
		});
		return { tool: input.tool, data };
	}

	if (input.tool === "job-description-keyword-extractor") {
		const data = await generateToolObject({
			schema: keywordsResultSchema,
			maxOutputTokens: 380,
			instructions: `${SHARED_RULES}
Extract ATS keywords from the JD. mustHave = required skills/phrases. niceToHave = optional. tools = software/stack. missing = mustHave/tools not in the resume; empty array if no resume.`,
			resume,
			job,
		});
		if (resume.kind === "none") {
			data.missing = [];
		}
		return { tool: input.tool, data };
	}

	const data = await generateToolObject({
		schema: matchResultSchema,
		maxOutputTokens: 400,
		instructions: `${SHARED_RULES}
Fit of resume to this JD. match 0-100. fit: strong >=75, partial >=45, else weak. overlapping = skills both share. gaps = JD needs not in resume. note: one short sentence.`,
		resume,
		job,
	});
	return { tool: "resume-job-match", data };
}
