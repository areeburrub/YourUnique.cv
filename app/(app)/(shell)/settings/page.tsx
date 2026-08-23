import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { UsageBar } from "@/app/(app)/(shell)/settings/_components/usage-bar";
import { buttonVariants } from "@/components/ui/button";
import { MixpanelCheckoutLink } from "@/components/mixpanel-checkout-link";
import { getUsageSummary } from "@/lib/db/usage";
import { syncPaidPlanFromDodo } from "@/lib/dodo-customer";
import { checkoutPath, isLifetimePlan, isPaidPlan, isProPlan, isTrialPlan, PlanId } from "@/lib/plans";
import { trialDaysRemaining } from "@/lib/trial";
import { nextUtcMidnight } from "@/lib/usage-status";
import { cn } from "@/lib/utils";

export default async function SettingsPage() {
	const { userId } = await auth();
	if (!userId) {
		redirect("/sign-in");
	}

	const user = await currentUser();
	const email = user?.primaryEmailAddress?.emailAddress ?? null;
	const existing = await getUsageSummary(userId);
	await syncPaidPlanFromDodo({
		userId,
		email,
		planId: existing.plan.id,
	});
	const summary = isPaidPlan(existing.plan.id)
		? existing
		: await getUsageSummary(userId);
	const isPro = isProPlan(summary.plan.id);
	const isLifetime = isLifetimePlan(summary.plan.id);
	const isTrial = isTrialPlan(summary.plan.id);
	const isPaid = isPaidPlan(summary.plan.id);
	const daysLeft = trialDaysRemaining(summary.trialEndsAt);

	return (
		<div className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6">
			<div className="mb-8">
				<h1 className="font-display text-2xl font-semibold tracking-[-0.4px]">
					Settings
				</h1>
			</div>

			<section className="space-y-6 rounded-[28px] bg-card p-7">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p className="text-sm text-muted-foreground">
							Current plan
						</p>
						<p className="font-display text-xl font-semibold tracking-[-0.3px]">
							{summary.plan.name}
						</p>
						{isTrial && daysLeft > 0 ? (
							<p className="mt-1 text-sm text-muted-foreground">
								{daysLeft} {daysLeft === 1 ? "day" : "days"} left
							</p>
						) : null}
					</div>
					<div className="flex flex-wrap items-center gap-2">
						{isPro ? (
							<a
								href="/api/customer-portal"
								className={cn(
									buttonVariants({ variant: "outline" }),
								)}
							>
								Manage subscription
							</a>
						) : null}
						{!isPaid ? (
							<>
								{summary.canStartTrial ? (
									<a
										href="/api/start-trial"
										className={cn(buttonVariants())}
									>
										Start trial
									</a>
								) : (
									<MixpanelCheckoutLink
										href={checkoutPath(PlanId.PRO)}
										source="settings"
										className={cn(buttonVariants())}
									>
										Get Pro
									</MixpanelCheckoutLink>
								)}
								<MixpanelCheckoutLink
									href={checkoutPath(PlanId.LIFETIME)}
									source="settings_lifetime"
									className={cn(
										buttonVariants({ variant: "outline" }),
									)}
								>
									Buy lifetime
								</MixpanelCheckoutLink>
							</>
						) : null}
						{isLifetime ? (
							<p className="text-sm text-muted-foreground">
								Lifetime access
							</p>
						) : null}
					</div>
				</div>

				<div className="space-y-5">
					<UsageBar
						label="Daily usage"
						used={summary.todayUsd}
						limit={summary.dailyLimitUsd}
						resetAt={nextUtcMidnight().toISOString()}
					/>
					<UsageBar
						label={isTrial ? "Trial usage" : "Monthly usage"}
						used={summary.rolling30dUsd}
						limit={summary.monthlyLimitUsd}
						resetAt={
							isTrial
								? (summary.trialEndsAt?.toISOString() ?? null)
								: (summary.monthlyResetAt?.toISOString() ?? null)
						}
						resetPrefix={isTrial ? "Ends" : "Resets"}
					/>
				</div>
			</section>
		</div>
	);
}
