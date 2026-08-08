import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getUserContext } from "@/lib/db/contexts";

import { ProfileWorkspace } from "./_components/profile-workspace";

export default async function ProfilePage() {
	const { userId } = await auth();
	await auth.protect();

	if (!userId) {
		redirect("/sign-in");
	}

	const context = await getUserContext(userId);
	if (!context) {
		redirect("/onboarding");
	}

	return (
		<ProfileWorkspace
			initialProfile={context.profile}
			initialUpdatedAt={context.updatedAt.toISOString()}
			initialMessages={[]}
		/>
	);
}
