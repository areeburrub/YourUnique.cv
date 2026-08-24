import { auth, currentUser } from "@clerk/nextjs/server";
import { cache } from "react";

import { AppClerkProvider } from "@/components/app-clerk-provider";
import { MixpanelIdentify } from "@/components/mixpanel-provider";
import { ensureUserSynced } from "@/lib/db/users";

const getCachedUser = cache(async () => currentUser());

export default async function AppLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { userId } = await auth();
	await auth.protect();

	const user = await getCachedUser();
	if (userId && user) {
		const email = user.primaryEmailAddress?.emailAddress;
		if (email) {
			await ensureUserSynced({
				id: userId,
				email,
				firstName: user.firstName,
				lastName: user.lastName,
				imageUrl: user.imageUrl,
			});
		}
	}

	return (
		<AppClerkProvider>
			<MixpanelIdentify />
			{children}
		</AppClerkProvider>
	);
}
