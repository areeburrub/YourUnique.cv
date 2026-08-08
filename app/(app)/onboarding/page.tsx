import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getUserContext } from "@/lib/db/contexts";

import { OnboardingView } from "./_components/onboarding-view";

export default async function OnboardingPage() {
	const { userId } = await auth();
	await auth.protect();

	if (!userId) {
		redirect("/sign-in");
	}

	const context = await getUserContext(userId);
	if (context) {
		redirect("/new-chat");
	}

	return <OnboardingView />;
}
