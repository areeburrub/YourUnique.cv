import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { markUserOnboarded } from "@/lib/db/users";
import { PlanId, isPlanId } from "@/lib/plans";

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

	const planId =
		typeof (body as { planId?: unknown })?.planId === "string"
			? (body as { planId: string }).planId
			: "";

	if (!isPlanId(planId)) {
		return NextResponse.json(
			{ error: "A plan selection is required" },
			{ status: 400 },
		);
	}

	await markUserOnboarded(userId);

	const redirectUrl =
		planId === PlanId.PRO
			? "/api/checkout"
			: "/new-chat?onboarding=1";

	return NextResponse.json({ redirectUrl });
}
