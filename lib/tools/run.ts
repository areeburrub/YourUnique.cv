import {
	generateText,
	NoObjectGeneratedError,
	NoOutputGeneratedError,
	Output,
	wrapLanguageModel,
	extractJsonMiddleware,
	type FilePart,
	type TextPart,
} from "ai";
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
	return wrapLanguageModel({
		model: openrouter(OPENROUTER_TOOLS_MODEL, {
			plugins: [{ id: "response-healing" }],
			usage: { include: true },
			structuredOutputs: { strict: false },
		}),
		middleware: extractJsonMiddleware(),
	});
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

type ResumePrompt =
	| { prompt: string }
	| { messages: Array<{ role: "user"; content: Array<TextPart | FilePart> }> };

function resumePrompt(
	resume: ScannedResume | { kind: "none" },
	job?: string,
): ResumePrompt {
	if (resume.kind === "none") {
		return { prompt: job ? `${job}\n\nRESUME: (none)` : "RESUME: (none)" };
	}
	if (resume.kind === "text") {
		return {
			prompt: job ? `RESUME:\n${resume.text}\n\n${job}` : resume.text,
		};
	}
	return {
		messages: [
			{
				role: "user",
				content: [
					{
						type: "text",
						text: job
							? `Scan the attached resume PDF. ${job}${
									resume.links ? `\n\n${resume.links}` : ""
								}`
							: "Scan the attached resume PDF.",
					},
					{
						type: "file",
						mediaType: "application/pdf",
						filename: resume.filename,
						data: resume.bytes,
					},
				],
			},
		],
	};
}

async function generateStructured<T>(input: {
	schema: z.ZodType<T>;
	name: string;
	maxOutputTokens: number;
	instructions: string;
	resume: ScannedResume | { kind: "none" };
	job?: string;
}): Promise<{ data: T; costUsd: number }> {
	const prompt = resumePrompt(input.resume, input.job);
	const result = await generateText({
		model: toolsModel(),
		output: Output.object({
			schema: input.schema,
			name: input.name,
		}),
		maxOutputTokens: input.maxOutputTokens,
		temperature: 0,
		instructions: input.instructions,
		providerOptions: {
			openrouter: {
				reasoning: { effort: "none" },
			},
		},
		...prompt,
	});

	try {
		return {
			data: result.output,
			costUsd: costFromProviderMetadata(result.providerMetadata),
		};
	} catch (error) {
		if (
			NoOutputGeneratedError.isInstance(error) ||
			NoObjectGeneratedError.isInstance(error)
		) {
			console.error("structured tool output missing", {
				finishReason: result.finishReason,
				text: result.text?.slice(0, 500),
				cause: "cause" in error ? error.cause : undefined,
			});
		}
		throw error;
	}
}

async function generateToolObject<T>(input: {
	schema: z.ZodType<T>;
	maxOutputTokens: number;
	instructions: string;
	resume: ScannedResume | { kind: "none" };
	job: string;
}): Promise<{ data: T; costUsd: number }> {
	return generateStructured({
		...input,
		name: "tool_result",
		job: `JOB:\n${input.job}`,
	});
}

async function extractLeadInfo(
	resume: ScannedResume | { kind: "none" },
): Promise<{ lead: LeadInfo; costUsd: number }> {
	if (resume.kind === "none") {
		return { lead: { name: null, email: null }, costUsd: 0 };
	}

	try {
		const { data, costUsd } = await generateStructured({
			schema: leadInfoSchema,
			name: "lead_info",
			maxOutputTokens: 256,
			instructions:
				"Extract the candidate's full name and email address from this resume. Return null for a field that is not present. Do not invent values.",
			resume,
		});
		return { lead: data, costUsd };
	} catch (error) {
		console.error("lead extract failed", error);
		return { lead: { name: null, email: null }, costUsd: 0 };
	}
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
			maxOutputTokens: 1500,
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
			maxOutputTokens: 1500,
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
		maxOutputTokens: 1500,
		instructions: `${SHARED_RULES}
Fit of resume to this JD. match 0-100. fit: strong >=75, partial >=45, else weak. overlapping = skills both share. gaps = JD needs not in resume. note: one short sentence.`,
		resume,
		job,
	});
	return { result: { tool: "resume-job-match", data }, costUsd };
}
