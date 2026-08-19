import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { MixpanelCheckoutLink } from "@/components/mixpanel-checkout-link";
import { getUsageSummary } from "@/lib/db/usage";
import { syncPaidPlanFromDodo } from "@/lib/dodo-customer";
import { checkoutPath, isLifetimePlan, isPaidPlan, isProPlan, PlanId } from "@/lib/plans";
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
	const isPaid = isPaidPlan(summary.plan.id);
	const usagePct =
		summary.monthlyLimitUsd > 0
			? Math.min(
					100,
					Math.round(
						(summary.rolling30dUsd / summary.monthlyLimitUsd) * 100,
					),
				)
			: 100;

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
								<MixpanelCheckoutLink
									href={checkoutPath(PlanId.PRO)}
									source="settings"
									className={cn(buttonVariants())}
								>
									Start trial
								</MixpanelCheckoutLink>
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

				<div className="space-y-2">
					<div className="flex items-center justify-between gap-3 text-sm">
						<span className="text-muted-foreground">Usage</span>
						<span className="font-medium text-foreground">
							{usagePct}%
						</span>
					</div>
					<div className="h-2 overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-brand transition-[width]"
							style={{ width: `${usagePct}%` }}
						/>
					</div>
				</div>
			</section>
		</div>
	);
}
