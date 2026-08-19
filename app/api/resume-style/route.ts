import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
	getUserContext,
	updateUserContextResumeStyle,
} from "@/lib/db/contexts";
import {
	EMPTY_RESUME_STYLE,
	parseResumeStyle,
	resumeStyleMemorySchema,
} from "@/lib/resume-style";

export async function GET() {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const row = await getUserContext(userId);
	return NextResponse.json(parseResumeStyle(row?.resumeStyle));
}

export async function PUT(req: Request) {
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

	const parsed = resumeStyleMemorySchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json({ error: "Invalid style memory" }, { status: 400 });
	}

	try {
		const row = await updateUserContextResumeStyle(userId, parsed.data);
		return NextResponse.json(parseResumeStyle(row?.resumeStyle));
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Could not save style memory";
		return NextResponse.json({ error: message }, { status: 400 });
	}
}

export async function DELETE() {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const row = await updateUserContextResumeStyle(userId, EMPTY_RESUME_STYLE);
		return NextResponse.json(parseResumeStyle(row?.resumeStyle));
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Could not clear style memory";
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
