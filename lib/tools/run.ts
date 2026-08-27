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
	leadInfoSchema,
	matchResultSchema,
	type LeadInfo,
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

type OpenRouterUsageMeta = { cost?: number };

function costFromProviderMetadata(metadata: unknown): number {
	if (!metadata || typeof metadata !== "object") {
		return 0;
	}
	const openrouterMeta = (
		metadata as { openrouter?: { usage?: OpenRouterUsageMeta } }
	).openrouter;
	const cost = openrouterMeta?.usage?.cost;
	return typeof cost === "number" && Number.isFinite(cost) && cost > 0
		? cost
		: 0;
}

async function generateToolObject<T>(input: {
	schema: z.ZodType<T>;
	maxOutputTokens: number;
	instructions: string;
	resume: ScannedResume | { kind: "none" };
	job: string;
}): Promise<{ data: T; costUsd: number }> {
	const job = `JOB:\n${input.job}`;
	const base = {
		model: toolsModel(),
		output: Output.object({ schema: input.schema }),
		maxOutputTokens: input.maxOutputTokens,
		temperature: 0,
		instructions: input.instructions,
	};

	if (input.resume.kind === "none") {
		const { output, providerMetadata } = await generateText({
			...base,
			prompt: `${job}\n\nRESUME: (none)`,
		});
		if (!output) {
			throw new Error("empty_tool_output");
		}
		return { data: output, costUsd: costFromProviderMetadata(providerMetadata) };
	}

	if (input.resume.kind === "text") {
		const { output, providerMetadata } = await generateText({
			...base,
			prompt: `RESUME:\n${input.resume.text}\n\n${job}`,
		});
		if (!output) {
			throw new Error("empty_tool_output");
		}
		return { data: output, costUsd: costFromProviderMetadata(providerMetadata) };
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

	const { output, providerMetadata } = await generateText({
		...base,
		messages: [{ role: "user", content: parts }],
	});
	if (!output) {
		throw new Error("empty_tool_output");
	}
	return { data: output, costUsd: costFromProviderMetadata(providerMetadata) };
}

async function extractLeadInfo(
	resume: ScannedResume | { kind: "none" },
): Promise<{ lead: LeadInfo; costUsd: number }> {
	if (resume.kind === "none") {
		return { lead: { name: null, email: null }, costUsd: 0 };
	}

	const base = {
		model: toolsModel(),
		output: Output.object({ schema: leadInfoSchema }),
		maxOutputTokens: 80,
		temperature: 0,
		instructions:
			"Extract the candidate's full name and email address from this resume. Return null for a field that is not present. Do not invent values.",
	};

	if (resume.kind === "text") {
		const { output, providerMetadata } = await generateText({
			...base,
			prompt: resume.text,
		});
		return {
			lead: output ?? { name: null, email: null },
			costUsd: costFromProviderMetadata(providerMetadata),
		};
	}

	const parts: Array<TextPart | FilePart> = [
		{ type: "text", text: "Scan the attached resume PDF." },
		{
			type: "file",
			mediaType: "application/pdf",
			filename: resume.filename,
			data: resume.bytes,
		},
	];
	const { output, providerMetadata } = await generateText({
		...base,
		messages: [{ role: "user", content: parts }],
	});
	return {
		lead: output ?? { name: null, email: null },
		costUsd: costFromProviderMetadata(providerMetadata),
	};
}

export type PublicToolRun = {
	result: ToolRunResult;
	usage: {
		costUsd: number;
		lead: LeadInfo;
	};
};

export async function runPublicTool(input: {
	tool: ToolSlug;
	jobText: string;
	resumePdf?: { filename: string; bytes: Uint8Array };
}): Promise<PublicToolRun> {
	const job = clip(input.jobText, JOB_CHAR_LIMIT);
	const resume: ScannedResume | { kind: "none" } = input.resumePdf
		? await scanResumePdf(input.resumePdf)
		: { kind: "none" };

	const [primary, leadExtraction] = await Promise.all([
		runPrimaryTool(input.tool, resume, job),
		extractLeadInfo(resume),
	]);

	return {
		result: primary.result,
		usage: {
			costUsd: primary.costUsd + leadExtraction.costUsd,
			lead: leadExtraction.lead,
		},
	};
}

async function runPrimaryTool(
	tool: ToolSlug,
	resume: ScannedResume | { kind: "none" },
	job: string,
): Promise<{ result: ToolRunResult; costUsd: number }> {
	if (tool === "ats-resume-checker") {
		const { data, costUsd } = await generateToolObject({
			schema: atsResultSchema,
			maxOutputTokens: 420,
			instructions: `${SHARED_RULES}
Score this resume vs this JD (0-100). Areas: keywords, skills, tools, seniority, evidence. Verdict: one short sentence.`,
			resume,
			job,
		});
		return { result: { tool, data }, costUsd };
	}

	if (tool === "job-description-keyword-extractor") {
		const { data, costUsd } = await generateToolObject({
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
		return { result: { tool, data }, costUsd };
	}

	const { data, costUsd } = await generateToolObject({
		schema: matchResultSchema,
		maxOutputTokens: 400,
		instructions: `${SHARED_RULES}
Fit of resume to this JD. match 0-100. fit: strong >=75, partial >=45, else weak. overlapping = skills both share. gaps = JD needs not in resume. note: one short sentence.`,
		resume,
		job,
	});
	return { result: { tool: "resume-job-match", data }, costUsd };
}
