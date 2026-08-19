import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getUserContext } from "@/lib/db/contexts";
import { getUserById, markUserOnboarded } from "@/lib/db/users";
import {
	isOnboardingContextComplete,
	resolveOnboardingStep,
} from "@/lib/onboarding/progress";
import { PlanId, checkoutPath, isPaidPlan } from "@/lib/plans";

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

	if (planId !== PlanId.PRO && planId !== PlanId.LIFETIME) {
		return NextResponse.json(
			{ error: "A plan selection is required" },
			{ status: 400 },
		);
	}

	const context = await getUserContext(userId);
	if (!isOnboardingContextComplete(context)) {
		const nextStep = resolveOnboardingStep(context);
		return NextResponse.json(
			{
				error: "Finish the earlier onboarding steps first",
				nextStep,
			},
			{ status: 400 },
		);
	}

	const dbUser = await getUserById(userId);
	await markUserOnboarded(userId);

	const redirectUrl = isPaidPlan(dbUser?.planId ?? PlanId.FREE)
		? "/new-chat"
		: checkoutPath(planId);

	return NextResponse.json({ redirectUrl });
}
