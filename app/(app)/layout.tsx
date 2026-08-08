import { auth, currentUser } from "@clerk/nextjs/server";

import { AppShell } from "@/components/app/app-shell";
import { listChatThreads } from "@/lib/mastra-chats";
import { ensureUserSynced } from "@/lib/db/users";

export default async function AppLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { userId } = await auth();
	await auth.protect();
	const user = await currentUser();

	const email = user?.primaryEmailAddress?.emailAddress ?? "";
	const name =
		user?.fullName?.trim() ||
		[user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
		user?.username?.trim() ||
		(email.includes("@") ? email.slice(0, email.indexOf("@")) : "") ||
		"Account";

	if (user && email) {
		await ensureUserSynced({
			id: user.id,
			email,
			firstName: user.firstName,
			lastName: user.lastName,
			imageUrl: user.imageUrl,
		});
	}

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
