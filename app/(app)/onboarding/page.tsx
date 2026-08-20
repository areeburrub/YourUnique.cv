import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/landing/brand-logo";
import { HeaderUserMenu } from "@/components/landing/header-user-menu";
import { ModeToggle } from "@/components/mode-toggle";
import {
	isLifetimeSignupIntent,
	isProSignupIntent,
} from "@/lib/auth-redirect";
import { getUserContext } from "@/lib/db/contexts";
import { getUserFileForUser } from "@/lib/db/files";
import { getUserById } from "@/lib/db/users";
import { resolveOnboardingStep } from "@/lib/onboarding/progress";
import { PlanId, checkoutPath, isPaidPlan } from "@/lib/plans";

import { OnboardingWizard } from "./_components/onboarding-wizard";

export default async function OnboardingPage({
	searchParams,
}: {
	searchParams: Promise<{ plan?: string }>;
}) {
	const { userId } = await auth();
	await auth.protect();

	if (!userId) {
		redirect("/sign-in");
	}

	const { plan } = await searchParams;
	const [dbUser, context] = await Promise.all([
		getUserById(userId),
		getUserContext(userId),
	]);

	if (
		!isPaidPlan(dbUser?.planId ?? PlanId.FREE) &&
		(isProSignupIntent(plan) || isLifetimeSignupIntent(plan))
	) {
		redirect(
			checkoutPath(
				isLifetimeSignupIntent(plan) ? PlanId.LIFETIME : PlanId.PRO,
			),
		);
	}

	if (dbUser?.onboardedAt) {
		redirect("/new-chat");
	}

	const resumeFileId = context?.sourceFileIds?.[0] ?? "";
	const resumeFile = resumeFileId
		? await getUserFileForUser(resumeFileId, userId)
		: null;
	const effectiveContext =
		context && resumeFileId && !resumeFile
			? { ...context, sourceFileIds: [] }
			: context;
	const initialStep = resolveOnboardingStep(effectiveContext);

	return (
		<div className="flex min-h-full flex-1 flex-col bg-background">
			<header className="sticky top-0 z-50 border-b border-border bg-background">
				<div className="rail flex h-16 items-center justify-between px-5 sm:px-8 md:h-[4.5rem] md:px-10">
					<BrandLogo />
					<div className="flex items-center gap-2.5">
						<ModeToggle />
						<HeaderUserMenu />
					</div>
				</div>
			</header>
			<OnboardingWizard
				initialStep={initialStep}
				initialResumeFileId={resumeFile?.id ?? ""}
				initialResumeFilename={resumeFile?.filename ?? ""}
				initialResumeMediaType={resumeFile?.contentType ?? ""}
				initialLinkedinUrl={context?.linkedinUrl ?? ""}
				initialIntroduction={context?.introduction ?? ""}
				initialProfileReady={Boolean(effectiveContext?.profile?.trim())}
			/>
		</div>
	);
}
