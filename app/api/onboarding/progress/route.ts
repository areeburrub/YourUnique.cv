import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
	getUserContext,
	patchUserContextOnboarding,
	upsertUserContext,
} from "@/lib/db/contexts";
import { getUserFileForUser } from "@/lib/db/files";
import { getUserById } from "@/lib/db/users";
import {
	isOnboardingContextComplete,
	resolveOnboardingStep,
} from "@/lib/onboarding/progress";
import { ensureCustomTemplateFromFile } from "@/lib/resume-templates/ensure-from-file";
import { getBuiltinTemplate } from "@/lib/resume-templates/builtins";
import { getResumeTemplateForUser } from "@/lib/db/templates";
import {
	isTemplateRef,
	parseTemplateRef,
} from "@/lib/resume-templates/refs";
import {
	isLinkedInProfileUrl,
	normalizeLinkedInProfileUrl,
} from "@/lib/linkedin-profile";

type ProgressStep = "resume" | "notes" | "profile" | "template";

export async function GET() {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const [dbUser, context] = await Promise.all([
		getUserById(userId),
		getUserContext(userId),
	]);

	return NextResponse.json({
		onboarded: Boolean(dbUser?.onboardedAt),
		complete: isOnboardingContextComplete(context),
		nextStep: resolveOnboardingStep(context),
		context: serializeContext(context),
	});
}

export async function POST(req: Request) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const dbUser = await getUserById(userId);
	if (dbUser?.onboardedAt) {
		return NextResponse.json(
			{ error: "Onboarding already completed" },
			{ status: 400 },
		);
	}

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const step =
		typeof (body as { step?: unknown })?.step === "string"
			? (body as { step: string }).step
			: "";

	if (
		step !== "resume" &&
		step !== "notes" &&
		step !== "profile" &&
		step !== "template"
	) {
		return NextResponse.json(
			{ error: "Invalid onboarding step" },
			{ status: 400 },
		);
	}

	const progressStep = step as ProgressStep;

	if (progressStep === "resume") {
		const resumeFileId =
			typeof (body as { resumeFileId?: unknown })?.resumeFileId === "string"
				? (body as { resumeFileId: string }).resumeFileId.trim()
				: "";
		const linkedinKeyProvided =
			typeof (body as { linkedinUrl?: unknown })?.linkedinUrl === "string";
		const linkedinRaw = linkedinKeyProvided
			? (body as { linkedinUrl: string }).linkedinUrl.trim()
			: "";
		if (linkedinRaw && !isLinkedInProfileUrl(linkedinRaw)) {
			return NextResponse.json(
				{ error: "Enter a valid LinkedIn profile URL, or leave it blank" },
				{ status: 400 },
			);
		}

		if (resumeFileId) {
			const file = await getUserFileForUser(resumeFileId, userId);
			if (!file) {
				return NextResponse.json(
					{ error: "Resume file not found" },
					{ status: 404 },
				);
			}
		}

		const linkedinUrl = linkedinRaw
			? normalizeLinkedInProfileUrl(linkedinRaw) || linkedinRaw
			: "";
		const context = await patchUserContextOnboarding({
			userId,
			sourceFileIds: resumeFileId ? [resumeFileId] : [],
			...(linkedinKeyProvided ? { linkedinUrl } : {}),
		});

		if (resumeFileId) {
			await ensureCustomTemplateFromFile({
				userId,
				fileId: resumeFileId,
				name: "Your resume",
			}).catch(() => undefined);
		}

		return NextResponse.json({
			ok: true,
			nextStep: resolveOnboardingStep(context),
			context: serializeContext(context),
		});
	}

	if (progressStep === "notes") {
		const introduction =
			typeof (body as { introduction?: unknown })?.introduction === "string"
				? (body as { introduction: string }).introduction.trim()
				: "";

		const context = await patchUserContextOnboarding({
			userId,
			introduction,
		});
		return NextResponse.json({
			ok: true,
			nextStep: resolveOnboardingStep(context),
			context: serializeContext(context),
		});
	}

	if (progressStep === "profile") {
		const existing = await getUserContext(userId);
		const fileId =
			typeof (body as { fileId?: unknown })?.fileId === "string"
				? (body as { fileId: string }).fileId.trim()
				: existing?.sourceFileIds?.[0] || "";
		const profile =
			typeof (body as { profile?: unknown })?.profile === "string"
				? (body as { profile: string }).profile.trim()
				: "";
		const linkedinRaw =
			typeof (body as { linkedinUrl?: unknown })?.linkedinUrl === "string"
				? (body as { linkedinUrl: string }).linkedinUrl.trim()
				: undefined;
		const introduction =
			typeof (body as { introduction?: unknown })?.introduction === "string"
				? (body as { introduction: string }).introduction.trim()
				: undefined;

		if (!profile) {
			return NextResponse.json(
				{ error: "Generated profile is empty" },
				{ status: 400 },
			);
		}

		const linkedinUrl =
			linkedinRaw === undefined
				? existing?.linkedinUrl ?? ""
				: linkedinRaw
					? normalizeLinkedInProfileUrl(linkedinRaw) || linkedinRaw
					: "";

		const context = await upsertUserContext({
			userId,
			profile,
			sourceFileIds: fileId ? [fileId] : existing?.sourceFileIds ?? [],
			linkedinUrl,
			introduction:
				introduction !== undefined
					? introduction
					: existing?.introduction ?? "",
		});
		return NextResponse.json({
			ok: true,
			nextStep: resolveOnboardingStep(context),
			context: serializeContext(context),
		});
	}

	const existing = await getUserContext(userId);
	if (!existing?.profile?.trim()) {
		return NextResponse.json(
			{ error: "Finish creating your profile before selecting a template" },
			{ status: 400 },
		);
	}

	const templateRef =
		typeof (body as { templateRef?: unknown })?.templateRef === "string"
			? (body as { templateRef: string }).templateRef.trim()
			: "";
	if (!isTemplateRef(templateRef)) {
		return NextResponse.json(
			{ error: "A valid templateRef is required" },
			{ status: 400 },
		);
	}

	const { kind, id } = parseTemplateRef(templateRef);
	if (kind === "builtin") {
		if (!getBuiltinTemplate(id)) {
			return NextResponse.json(
				{ error: "Unknown builtin template" },
				{ status: 404 },
			);
		}
	} else {
		const custom = await getResumeTemplateForUser(id, userId);
		if (!custom) {
			return NextResponse.json(
				{ error: "Template not found" },
				{ status: 404 },
			);
		}
		if (custom.status !== "ready") {
			return NextResponse.json(
				{ error: "Template is not ready yet" },
				{ status: 400 },
			);
		}
	}

	const context = await patchUserContextOnboarding({
		userId,
		templateRef,
	});
	return NextResponse.json({
		ok: true,
		nextStep: resolveOnboardingStep(context),
		context: serializeContext(context),
	});
}

function serializeContext(
	context:
		| Awaited<ReturnType<typeof patchUserContextOnboarding>>
		| Awaited<ReturnType<typeof getUserContext>>,
) {
	if (!context) {
		return null;
	}
	return {
		sourceFileIds: context.sourceFileIds,
		linkedinUrl: context.linkedinUrl,
		introduction: context.introduction,
		profile: context.profile,
		templateRef: context.templateRef,
	};
}
