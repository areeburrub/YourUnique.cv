import { auth } from "@clerk/nextjs/server";

import { checkUsageLimit } from "@/lib/db/usage";

export async function GET() {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const result = await checkUsageLimit(userId);
	const { summary } = result;

	return Response.json({
		blocked: result.blocked,
		scope: result.blocked ? result.scope : null,
		resetAt: result.blocked ? (result.resetAt?.toISOString() ?? null) : null,
		plan: {
			id: summary.plan.id,
			name: summary.plan.name,
			monthlyLimitUsd: summary.monthlyLimitUsd,
			dailyLimitUsd: summary.dailyLimitUsd,
			dodoProductId: summary.plan.dodoProductId,
		},
		usage: {
			today: summary.todayUsd,
			rolling30d: summary.rolling30dUsd,
		},
		bonusCreditsUsd: summary.bonusCreditsUsd,
		supportEmail: process.env.SUPPORT_EMAIL ?? null,
	});
}
