import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";

import { AppShell } from "@/components/app/app-shell";
import { CHATS_PAGE_SIZE } from "@/lib/chats";
import { db } from "@/lib/db";
import { userHasReadyResume } from "@/lib/db/resumes";
import { expirePaidAccessIfNeeded } from "@/lib/db/trials";
import { users } from "@/lib/db/schema";
import { listChatThreads } from "@/lib/mastra-chats";
import { syncPaidPlanFromDodo } from "@/lib/dodo-customer";
import { isLifetimePlan, isProPlan } from "@/lib/plans";
import { getUpgradeCta } from "@/lib/trial";

const getCachedUser = cache(async () => currentUser());
const getCachedPlanId = cache(
	async (userId: string, email: string | null, planId: string | null) =>
		syncPaidPlanFromDodo({ userId, email, planId }),
);

export default async function ShellLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { userId } = await auth();
	await auth.protect();

	if (!userId) {
		redirect("/sign-in");
	}

	const [user, dbUser, recentResult, hasReadyResume] = await Promise.all([
		getCachedUser(),
		db.query.users.findFirst({
			where: eq(users.id, userId),
			columns: {
				planId: true,
				onboardedAt: true,
				trialEndsAt: true,
				proExpiresAt: true,
			},
		}),
		listChatThreads(userId, {
			limit: CHATS_PAGE_SIZE,
			page: 0,
		}),
		userHasReadyResume(userId),
	]);

	if (!dbUser?.onboardedAt) {
		redirect("/onboarding");
	}

	const email = user?.primaryEmailAddress?.emailAddress ?? "";
	const name =
		user?.fullName?.trim() ||
		[user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
		user?.username?.trim() ||
		(email.includes("@") ? email.slice(0, email.indexOf("@")) : "") ||
		"Account";

	const resolved = await expirePaidAccessIfNeeded({
		id: userId,
		planId: dbUser?.planId ?? "FREE",
		trialEndsAt: dbUser?.trialEndsAt ?? null,
		proExpiresAt: dbUser?.proExpiresAt ?? null,
	});
	const planId = await getCachedPlanId(
		userId,
		email || null,
		resolved.planId,
	);
	const resolvedPlanId = planId ?? resolved.planId;
	const upgrade = getUpgradeCta({
		planId: resolvedPlanId,
		trialEndsAt: resolved.trialEndsAt,
		proExpiresAt: resolved.proExpiresAt,
	});
	const planBadge = isProPlan(resolvedPlanId)
		? "Pro"
		: isLifetimePlan(resolvedPlanId)
			? "Lifetime"
			: null;

	return (
		<AppShell
			user={{
				name,
				email,
				imageUrl: user?.imageUrl,
			}}
			recentThreads={recentResult.threads}
			recentHasMore={recentResult.hasMore}
			showUpgrade={Boolean(upgrade)}
			upgradeHref={upgrade?.href ?? "/api/checkout"}
			upgradeLabel={upgrade?.label}
			planBadge={planBadge}
			hasReadyResume={hasReadyResume}
		>
			{children}
		</AppShell>
	);
}
