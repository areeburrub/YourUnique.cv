import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/landing/brand-logo";
import { ModeToggle } from "@/components/mode-toggle";
import { getUserById } from "@/lib/db/users";

import { OnboardingWizard } from "./_components/onboarding-wizard";

export default async function OnboardingPage() {
	const { userId } = await auth();
	await auth.protect();

	if (!userId) {
		redirect("/sign-in");
	}

	const dbUser = await getUserById(userId);

	if (dbUser?.onboardedAt) {
		redirect("/new-chat");
	}

	return (
		<div className="flex min-h-full flex-1 flex-col bg-background">
			<header className="border-b border-border">
				<div className="rail flex h-14 items-center justify-between px-4 sm:px-8 md:px-10">
					<BrandLogo />
					<div className="flex items-center gap-2">
						<ModeToggle />
						<UserButton
							appearance={{
								elements: {
									avatarBox: "size-8",
								},
							}}
						/>
					</div>
				</div>
			</header>
			<OnboardingWizard />
		</div>
	);
}
