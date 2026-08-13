import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
	getUserContext,
	updateUserContextTemplateRef,
} from "@/lib/db/contexts";
import { getResumeTemplateForUser } from "@/lib/db/templates";
import { getBuiltinTemplate } from "@/lib/resume-templates/builtins";
import {
	isTemplateRef,
	parseTemplateRef,
} from "@/lib/resume-templates/refs";

export async function POST(req: Request) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const templateRef =
		typeof (body as { templateRef?: unknown })?.templateRef === "string"
			? (body as { templateRef: string }).templateRef
			: "";

	if (!isTemplateRef(templateRef)) {
		return NextResponse.json(
			{ error: "A valid templateRef is required" },
			{ status: 400 },
		);
	}

	const existing = await getUserContext(userId);
	if (!existing?.profile?.trim()) {
		return NextResponse.json(
			{ error: "Finish creating your profile before selecting a template" },
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

	const row = await updateUserContextTemplateRef(userId, templateRef);
	return NextResponse.json({
		ok: true,
		templateRef: row?.templateRef ?? templateRef,
	});
}
