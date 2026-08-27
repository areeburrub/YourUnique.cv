import { after } from "next/server";
import { z } from "zod";

import { recordFreeToolLead } from "@/lib/db/free-tool-leads";
import { putR2Object } from "@/lib/r2";
import { isToolSlug } from "@/lib/tools/catalog";
import { JOB_CHAR_LIMIT, TOOL_PDF_MAX_BYTES } from "@/lib/tools/constants";
import {
	analyzeStatusLabel,
	type ToolStreamEvent,
} from "@/lib/tools/events";
import { jobFetchStatus, resolveJobText } from "@/lib/tools/fetch-job";
import { classifyJobInput, isJobInputReady } from "@/lib/tools/job-input";
import { runPublicTool } from "@/lib/tools/run";
import { clientIpFromHeaders, verifyTurnstileToken } from "@/lib/turnstile";
import {
	isAllowedOnboardingUploadMediaType,
	mediaTypeFromFilename,
	resolveUploadMediaType,
	sanitizeFilename,
} from "@/lib/uploads";

export const maxDuration = 90;

function formString(form: FormData, key: string) {
	const value = form.get(key);
	return typeof value === "string" ? value : "";
}

function jsonError(error: string, status: number) {
	return Response.json({ error }, { status });
}

function streamEvents(
	run: (send: (event: ToolStreamEvent) => void) => Promise<void>,
) {
	const encoder = new TextEncoder();
	const stream = new ReadableStream({
		async start(controller) {
			const send = (event: ToolStreamEvent) => {
				controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
			};
			try {
				await run(send);
			} catch (error) {
				console.error("public tool failed", error);
				send({
					type: "error",
					error:
						error instanceof Error &&
						/^(Could not|That posting)/.test(error.message)
							? error.message
							: "Could not run this tool. Try again in a moment.",
				});
			} finally {
				controller.close();
			}
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "application/x-ndjson; charset=utf-8",
			"Cache-Control": "no-cache",
		},
	});
}

export async function POST(request: Request) {
	if (!process.env.OPENROUTER_API_KEY) {
		return jsonError("This tool is temporarily unavailable", 503);
	}

	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return jsonError("Invalid form data", 400);
	}

	const tool = formString(form, "tool").trim();
	const jobInput = formString(form, "jobText").trim();
	const turnstileToken = formString(form, "turnstileToken").trim();
	const resumeFile = form.get("resume");

	if (!isToolSlug(tool)) {
		return jsonError("Unknown tool", 400);
	}
	if (turnstileToken.length < 1 || turnstileToken.length > 4096) {
		return jsonError("Complete the bot check before running the tool", 400);
	}
	if (jobInput.length < 8 || jobInput.length > JOB_CHAR_LIMIT + 200) {
		return jsonError("Paste a job description or a job link", 400);
	}
	if (!isJobInputReady(jobInput)) {
		return jsonError("Paste more of the job description, or a job link", 400);
	}

	const resumeRequired = tool !== "job-description-keyword-extractor";
	let resumePdf: { filename: string; bytes: Uint8Array } | undefined;

	if (resumeFile instanceof File && resumeFile.size > 0) {
		const mediaType =
			resolveUploadMediaType({
				filename: resumeFile.name,
				mediaType: resumeFile.type || mediaTypeFromFilename(resumeFile.name),
			}) || resumeFile.type;
		if (!isAllowedOnboardingUploadMediaType(mediaType)) {
			return jsonError("Upload a PDF resume", 400);
		}
		if (resumeFile.size > TOOL_PDF_MAX_BYTES) {
			return jsonError("Resume must be 8MB or smaller", 400);
		}
		resumePdf = {
			filename: sanitizeFilename(resumeFile.name),
			bytes: new Uint8Array(await resumeFile.arrayBuffer()),
		};
	} else if (resumeRequired) {
		return jsonError("Upload a PDF resume", 400);
	}

	const parsedToken = z.string().min(1).max(4096).safeParse(turnstileToken);
	if (!parsedToken.success) {
		return jsonError("Invalid bot check", 400);
	}

	const verified = await verifyTurnstileToken({
		token: parsedToken.data,
		ip: clientIpFromHeaders(request.headers),
	});
	if (!verified.ok) {
		return jsonError(verified.error, 403);
	}

	const classified = classifyJobInput(jobInput);
	const fetchStatus = jobFetchStatus(classified);
	const ip = clientIpFromHeaders(request.headers);

	return streamEvents(async (send) => {
		if (fetchStatus) {
			send({ type: "status", id: fetchStatus.id, label: fetchStatus.label });
		}

		const jobText = await resolveJobText(jobInput);

		send({
			type: "status",
			id: "analyze",
			label: analyzeStatusLabel(tool),
		});

		const startedAt = Date.now();
		const { result, usage } = await runPublicTool({ tool, jobText, resumePdf });
		const durationMs = Date.now() - startedAt;

		after(() =>
			persistFreeToolUsage({
				tool,
				jobText,
				resumePdf,
				result,
				usage,
				durationMs,
				ip,
			}),
		);

		send({ type: "result", result });
	});
}

async function persistFreeToolUsage(input: {
	tool: string;
	jobText: string;
	resumePdf?: { filename: string; bytes: Uint8Array };
	result: unknown;
	usage: { costUsd: number; lead: { name: string | null; email: string | null } };
	durationMs: number;
	ip: string | null;
}) {
	try {
		const id = crypto.randomUUID();
		let resumeFileKey: string | null = null;

		if (input.resumePdf) {
			resumeFileKey = `free-tool-leads/${id}.pdf`;
			await putR2Object({
				key: resumeFileKey,
				body: input.resumePdf.bytes,
				contentType: "application/pdf",
			});
		}

		await recordFreeToolLead({
			id,
			tool: input.tool,
			leadName: input.usage.lead.name,
			leadEmail: input.usage.lead.email,
			resumeFileKey,
			resumeFilename: input.resumePdf?.filename ?? null,
			jobText: input.jobText || null,
			resultJson: input.result as Record<string, unknown>,
			costUsd: input.usage.costUsd,
			durationMs: input.durationMs,
			ip: input.ip,
		});
	} catch (error) {
		console.error("failed to persist free tool usage", error);
	}
}
