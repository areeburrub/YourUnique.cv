import { after } from "next/server";
import { z } from "zod";

import { runPublicTool } from "@/lib/tools/run";
import { isToolSlug } from "@/lib/tools/catalog";
import { JOB_CHAR_LIMIT, TOOL_PDF_MAX_BYTES } from "@/lib/tools/constants";
import { clientIpFromHeaders, verifyTurnstileToken } from "@/lib/turnstile";
import {
	isAllowedOnboardingUploadMediaType,
	mediaTypeFromFilename,
	resolveUploadMediaType,
	sanitizeFilename,
} from "@/lib/uploads";
import { recordFreeToolLead } from "@/lib/db/free-tool-leads";
import { putR2Object } from "@/lib/r2";

export const maxDuration = 45;

function formString(form: FormData, key: string) {
	const value = form.get(key);
	return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
	if (!process.env.OPENROUTER_API_KEY) {
		return Response.json(
			{ error: "This tool is temporarily unavailable" },
			{ status: 503 },
		);
	}

	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return Response.json({ error: "Invalid form data" }, { status: 400 });
	}

	const tool = formString(form, "tool").trim();
	const jobText = formString(form, "jobText").trim();
	const turnstileToken = formString(form, "turnstileToken").trim();
	const resumeFile = form.get("resume");

	if (!isToolSlug(tool)) {
		return Response.json({ error: "Unknown tool" }, { status: 400 });
	}
	if (turnstileToken.length < 1 || turnstileToken.length > 4096) {
		return Response.json(
			{ error: "Complete the bot check before running the tool" },
			{ status: 400 },
		);
	}
	if (jobText.length < 40 || jobText.length > JOB_CHAR_LIMIT + 200) {
		return Response.json(
			{ error: "Paste more of the job description" },
			{ status: 400 },
		);
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
			return Response.json(
				{ error: "Upload a PDF resume" },
				{ status: 400 },
			);
		}
		if (resumeFile.size > TOOL_PDF_MAX_BYTES) {
			return Response.json(
				{ error: "Resume must be 8MB or smaller" },
				{ status: 400 },
			);
		}
		resumePdf = {
			filename: sanitizeFilename(resumeFile.name),
			bytes: new Uint8Array(await resumeFile.arrayBuffer()),
		};
	} else if (resumeRequired) {
		return Response.json(
			{ error: "Upload a PDF resume" },
			{ status: 400 },
		);
	}

	const parsedToken = z.string().min(1).max(4096).safeParse(turnstileToken);
	if (!parsedToken.success) {
		return Response.json({ error: "Invalid bot check" }, { status: 400 });
	}

	const verified = await verifyTurnstileToken({
		token: parsedToken.data,
		ip: clientIpFromHeaders(request.headers),
	});
	if (!verified.ok) {
		return Response.json({ error: verified.error }, { status: 403 });
	}

	try {
		const { result, usage } = await runPublicTool({ tool, jobText, resumePdf });
		const ip = clientIpFromHeaders(request.headers);
		after(() =>
			persistFreeToolUsage({ tool, jobText, resumePdf, result, usage, ip }),
		);
		return Response.json({ result });
	} catch (error) {
		console.error("public tool failed", error);
		return Response.json(
			{ error: "Could not run this tool. Try again in a moment." },
			{ status: 502 },
		);
	}
}

async function persistFreeToolUsage(input: {
	tool: string;
	jobText: string;
	resumePdf?: { filename: string; bytes: Uint8Array };
	result: unknown;
	usage: { costUsd: number; lead: { name: string | null; email: string | null } };
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
			ip: input.ip,
		});
	} catch (error) {
		console.error("failed to persist free tool usage", error);
	}
}
