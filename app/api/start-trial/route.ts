import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { startUserTrial } from "@/lib/db/trials";
import { checkoutPath, PlanId } from "@/lib/plans";

export async function GET(req: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.redirect(new URL("/sign-in", req.url));
	}

	const result = await startUserTrial(userId);
	if (result.ok) {
		return NextResponse.redirect(new URL("/new-chat", req.url));
	}

	if (result.reason === "used") {
		return NextResponse.redirect(new URL(checkoutPath(PlanId.PRO), req.url));
	}

	return NextResponse.redirect(new URL("/new-chat", req.url));
}
