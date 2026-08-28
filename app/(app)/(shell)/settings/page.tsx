import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { AccountSettings } from "@/app/(app)/(shell)/settings/_components/account-settings";
import { NotificationSettings } from "@/app/(app)/(shell)/settings/_components/notification-settings";
import { SettingsBackButton } from "@/app/(app)/(shell)/settings/_components/settings-back-button";
import { UsageBar } from "@/components/usage-bar";
import { ProCheckoutButton } from "@/components/billing/pro-checkout-button";
import { buttonVariants } from "@/components/ui/button";
import { getUserById } from "@/lib/db/users";
import { getUsageSummary } from "@/lib/db/usage";
import { syncPaidPlanFromDodo } from "@/lib/dodo-customer";
import {
	isLifetimePlan,
	isPaidPlan,
	isProPlan,
	isFreePlan,
} from "@/lib/plans";
import { nextUtcMidnight } from "@/lib/usage-status";
import { cn } from "@/lib/utils";

function formatProUntil(date: Date | null) {
	if (!date) {
		return null;
	}
	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export default async function SettingsPage() {
	const { userId } = await auth();
	if (!userId) {
		redirect("/sign-in");
	}

	const user = await currentUser();
	const email = user?.primaryEmailAddress?.emailAddress ?? null;
	const [existing, dbUser] = await Promise.all([
		getUsageSummary(userId),
		getUserById(userId),
	]);
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
	const isFree = isFreePlan(summary.plan.id);
	const proUntil = formatProUntil(summary.proExpiresAt);

	return (
		<div className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6">
			<div className="mb-8 flex items-center gap-2">
				<SettingsBackButton />
				<h1 className="font-display text-2xl font-semibold tracking-[-0.4px]">
					Settings
				</h1>
			</div>

			<AccountSettings
				name={
					user?.fullName?.trim() ||
					user?.firstName?.trim() ||
					"Account"
				}
				email={email ?? ""}
				imageUrl={user?.imageUrl}
			/>

			<section className="mt-6 space-y-6 rounded-[28px] bg-card p-7">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p className="text-sm text-muted-foreground">
							Current plan
						</p>
						<p className="font-display text-xl font-semibold tracking-[-0.3px]">
							{summary.plan.name}
						</p>
						{isPro && proUntil ? (
							<p className="mt-1 text-sm text-muted-foreground">
								Pro until {proUntil}
							</p>
						) : null}
						{isLifetime ? (
							<p className="mt-1 text-sm text-muted-foreground">
								Lifetime access
							</p>
						) : null}
					</div>
					{isPro ? (
						<a
							href="/api/customer-portal"
							className={cn(buttonVariants({ variant: "outline" }))}
						>
							Billing portal
						</a>
					) : null}
				</div>

				{isFree ? (
					<ProCheckoutButton source="settings" />
				) : null}

				<div className="space-y-5">
					<UsageBar
						label="Daily usage"
						used={summary.todayUsd}
						limit={summary.dailyLimitUsd}
						resetAt={nextUtcMidnight().toISOString()}
					/>
					<UsageBar
						label="Monthly usage"
						used={summary.rolling30dUsd}
						limit={summary.monthlyLimitUsd}
						resetAt={summary.monthlyResetAt?.toISOString() ?? null}
						resetPrefix="Resets"
					/>
				</div>
			</section>

			<div className="mt-6">
				<NotificationSettings
					promotionalEnabled={dbUser?.emailRemindersEnabled ?? true}
				/>
			</div>
		</div>
	);
}
