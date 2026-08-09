import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";

import { AppShell } from "@/components/app/app-shell";
import { CHATS_PAGE_SIZE } from "@/lib/chats";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { listChatThreads } from "@/lib/mastra-chats";
import { isProPlan } from "@/lib/plans";

const getCachedUser = cache(async () => currentUser());

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

	const [user, dbUser, recentResult] = await Promise.all([
		getCachedUser(),
		db.query.users.findFirst({
			where: eq(users.id, userId),
			columns: { planId: true, onboardedAt: true },
		}),
		listChatThreads(userId, {
			limit: CHATS_PAGE_SIZE,
			page: 0,
		}),
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

	const showUpgrade = !isProPlan(dbUser?.planId ?? "FREE");

	return (
		<AppShell
			user={{
				name,
				email,
				imageUrl: user?.imageUrl,
			}}
			recentThreads={recentResult.threads}
			recentHasMore={recentResult.hasMore}
			showUpgrade={showUpgrade}
			upgradeHref="/api/checkout"
		>
			{children}
		</AppShell>
	);
}
