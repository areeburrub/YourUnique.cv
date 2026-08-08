import { auth, currentUser } from "@clerk/nextjs/server";
import { cache } from "react";

import { AppShell } from "@/components/app/app-shell";
import { listChatThreads } from "@/lib/mastra-chats";

const getCachedUser = cache(async () => currentUser());

export default async function AppLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { userId } = await auth();
	await auth.protect();
	const user = await getCachedUser();

	const email = user?.primaryEmailAddress?.emailAddress ?? "";
	const name =
		user?.fullName?.trim() ||
		[user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
		user?.username?.trim() ||
		(email.includes("@") ? email.slice(0, email.indexOf("@")) : "") ||
		"Account";

	const recentThreads = userId
		? await listChatThreads(userId, { limit: 4 })
		: [];

	return (
		<AppShell
			user={{
				name,
				email,
				imageUrl: user?.imageUrl,
			}}
			recentThreads={recentThreads}
		>
			{children}
		</AppShell>
	);
}
