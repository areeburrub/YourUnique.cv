import { auth } from "@clerk/nextjs/server";
import { streamText, type FilePart, type TextPart } from "ai";
import { after } from "next/server";

import {
	OPENROUTER_CHAT_MODEL,
	openrouter,
	openrouterFileParserPlugins,
} from "@/lib/ai/openrouter";
import { getUserContext, upsertUserContext } from "@/lib/db/contexts";
import { getUserFileForUser } from "@/lib/db/files";
import { checkUsageLimit } from "@/lib/db/usage";
import { getUserById } from "@/lib/db/users";
import { notifyUsageLimitHit } from "@/lib/email/resend-lifecycle";
import { getR2Object } from "@/lib/r2";
import { fetchLinkedInProfile } from "@/lib/fetch-linkedin-profile";
import { normalizeLinkedInProfileUrl } from "@/lib/linkedin-profile";
import { extractPdfLinks, formatPdfLinksForModel } from "@/lib/pdf-links";

export const maxDuration = 300;

type ModelContentPart = TextPart | FilePart;

const SYSTEM_PROMPT = `You create a durable career profile markdown document for YourUnique.cv.

Rules:
- Use only facts from the resume file (if provided), optional LinkedIn JSON, and optional user notes.
- Never invent employers, dates, metrics, degrees, or skills.
- Prefer the resume for employment detail when LinkedIn fields are sparse or redacted.
- Include the LinkedIn URL in contact/links when one was provided.
- Always keep GitHub, LinkedIn, website/portfolio, and project URLs from the resume. A "Links extracted from the resume PDF" list may be provided — those are real hyperlinks from the file, often behind a word like GitHub or an icon whose URL is not printed. Copy them into contact or the matching project. Write them as markdown [GitHub](https://github.com/...) so both the label and URL are kept. Never invent a URL that is not in the resume, the extracted list, LinkedIn JSON, or notes.
- Output markdown only — no preamble, no code fences around the whole document.
- Cover when known: contact/identity (including links), professional summary, work experience (roles, companies, dates, concrete achievements), education, skills, projects/certifications, and target direction from notes.`;

async function fileContentForModel(input: {
	userId: string;
	fileId: string;
}): Promise<ModelContentPart[] | null> {
	const file = await getUserFileForUser(input.fileId, input.userId);
	if (!file) {
		return null;
	}

	const mediaType = file.contentType;
	const filename = file.filename;

	const object = await getR2Object(file.key);
	const body = object.Body;
	if (!body) {
		return [
			{
				type: "text",
				text: `Resume file "${filename}" could not be read.`,
			},
		];
	}

	const bytes = await body.transformToByteArray();

	if (mediaType.startsWith("image/") || mediaType === "application/pdf") {
		const linkText =
			mediaType === "application/pdf"
				? formatPdfLinksForModel(extractPdfLinks(bytes), filename)
				: "";
		return [
			{
				type: "text",
				text: `Resume file: ${filename}`,
			},
			...(linkText ? [{ type: "text" as const, text: linkText }] : []),
			{
				type: "file",
				mediaType,
				filename,
				data: bytes,
			},
		];
	}

	if (mediaType === "text/plain" || mediaType === "text/markdown") {
		const text = Buffer.from(bytes).toString("utf8").trim();
		return [
			{
				type: "text",
				text: text
					? `Resume file "${filename}":\n\n${text}`
					: `Resume file "${filename}" was empty.`,
			},
		];
	}

	return [
		{
			type: "text",
			text: `The user uploaded resume "${filename}" (${mediaType}), which is not a readable PDF. Extract what you can from any accompanying notes/LinkedIn, and leave gaps rather than inventing.`,
		},
	];
}

export async function POST(req: Request) {
	if (!process.env.OPENROUTER_API_KEY) {
		return Response.json(
			{ error: "OPENROUTER_API_KEY is not configured" },
			{ status: 503 },
		);
	}

	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const limit = await checkUsageLimit(userId);
	if (limit.blocked) {
		after(() => notifyUsageLimitHit(userId, limit.scope));
		return Response.json(
			{
				error: "usage_limit",
				scope: limit.scope,
				resetAt: limit.resetAt?.toISOString() ?? null,
				plan: limit.plan.id,
			},
			{ status: 402 },
		);
	}

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return Response.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const fileId =
		typeof (body as { fileId?: unknown })?.fileId === "string"
			? (body as { fileId: string }).fileId.trim()
			: "";
	const linkedinRaw =
		typeof (body as { linkedinUrl?: unknown })?.linkedinUrl === "string"
			? (body as { linkedinUrl: string }).linkedinUrl
			: "";
	const notes =
		typeof (body as { notes?: unknown })?.notes === "string"
			? (body as { notes: string }).notes.trim()
			: "";

	const linkedinUrl = normalizeLinkedInProfileUrl(linkedinRaw);
	if (!fileId && !linkedinUrl && !notes) {
		return Response.json(
			{ error: "Add your resume, LinkedIn, or notes to continue" },
			{ status: 400 },
		);
	}

	const [dbUser, existingContext, fileParts] = await Promise.all([
		getUserById(userId),
		getUserContext(userId),
		fileId ? fileContentForModel({ userId, fileId }) : Promise.resolve([]),
	]);

	if (dbUser?.onboardedAt && existingContext?.profile?.trim()) {
		return Response.json(
			{ error: "Onboarding already completed" },
			{ status: 400 },
		);
	}

	if (fileId && !fileParts) {
		return Response.json({ error: "Resume file not found" }, { status: 404 });
	}

	const linkedinProfile = linkedinUrl
		? await fetchLinkedInProfile(linkedinUrl)
		: null;

	const extraBlocks: string[] = [];
	if (linkedinUrl) {
		extraBlocks.push(`LinkedIn URL: ${linkedinUrl}`);
		if (linkedinProfile) {
			extraBlocks.push(
				`LinkedIn public profile JSON:\n${JSON.stringify(linkedinProfile, null, 2)}`,
			);
		} else {
			extraBlocks.push(
				"LinkedIn profile could not be fetched. Still include the LinkedIn URL in the profile links if appropriate.",
			);
		}
	}
	if (notes) {
		extraBlocks.push(
			`Additional notes from the user (not necessarily on the resume):\n${notes}`,
		);
	}

	const promptText = [
		fileId
			? "Build the full career profile markdown from the attached resume and the context below."
			: "Build the full career profile markdown from the context below. No resume was provided, so rely on the LinkedIn profile and notes.",
		...extraBlocks,
	].join("\n\n");

	const result = streamText({
		model: openrouter(OPENROUTER_CHAT_MODEL, {
			plugins: openrouterFileParserPlugins,
		}),
		system: SYSTEM_PROMPT,
		messages: [
			{
				role: "user",
				content: [
					{ type: "text", text: promptText },
					...(fileParts ?? []),
				],
			},
		],
		onFinish: async ({ text }) => {
			const profile = text.trim();
			if (!profile) {
				return;
			}
			await upsertUserContext({
				userId,
				profile,
				sourceFileIds: fileId ? [fileId] : [],
				linkedinUrl: linkedinUrl || linkedinRaw.trim() || "",
				introduction: notes || "",
			});
		},
	});

	return result.toTextStreamResponse();
}
