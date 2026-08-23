"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { MixpanelEvent, trackEvent } from "@/lib/mixpanel";
import { isPaidPlan, isTrialPlan, START_TRIAL_PATH } from "@/lib/plans";
import {
	formatDailyResetAt,
	nextUtcMidnight,
	type UsageStatusResponse,
} from "@/lib/usage-status";
import { cn } from "@/lib/utils";

type UsageLimitDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	status: UsageStatusResponse;
};

export function UsageLimitDialog({
	open,
	onOpenChange,
	status,
}: UsageLimitDialogProps) {
	const isPaid = isPaidPlan(status.plan.id);
	const isTrial = isTrialPlan(status.plan.id);
	const resetLabel = formatDailyResetAt(
		status.resetAt ? new Date(status.resetAt) : nextUtcMidnight(),
	);
	const supportEmail = status.supportEmail;

	const usageLine = status.blocked
		? status.scope === "daily"
			? resetLabel
				? `You've hit today's limit. It resets at ${resetLabel}.`
				: "You've hit today's limit."
			: isPaid
				? "You've reached your usage limit for now."
				: isTrial && status.isTrialActive === false
					? "Your trial has ended."
					: "You've used this trial's resumes."
		: resetLabel
			? `You've hit 90% of today's usage. It resets at ${resetLabel}.`
			: "You've hit 90% of today's usage.";

	const title = isPaid
		? `You're already on ${status.plan.name}`
		: status.blocked
			? status.scope === "daily"
				? "Daily limit reached"
				: "Usage limit reached"
			: status.canStartTrial
				? "Start your 7-day trial"
				: "Get Pro";

	const upgradeHref = isPaid
		? null
		: status.canStartTrial
			? START_TRIAL_PATH
			: "/api/checkout";
	const upgradeLabel = status.canStartTrial ? "Start 7-day trial" : "Get Pro";
	const upgradeEvent = status.canStartTrial
		? MixpanelEvent.TrialStarted
		: MixpanelEvent.CheckoutStarted;

	const mailtoHref = supportEmail
		? `mailto:${supportEmail}?subject=${encodeURIComponent("Higher usage limits")}`
		: null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>
						{usageLine}{" "}
						{isPaid ? (
							<>
								You're a power user. Ping me
								{supportEmail ? (
									<>
										{" "}
										at{" "}
										<a
											href={mailtoHref ?? undefined}
											className="font-medium text-foreground underline underline-offset-2"
										>
											{supportEmail}
										</a>
									</>
								) : null}{" "}
								and I'll add some more.
							</>
						) : status.canStartTrial ? (
							"Start your 7-day trial to keep tailoring."
						) : (
							"Get Pro to keep tailoring."
						)}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="sm:justify-end">
					{upgradeHref ? (
						<a
							href={upgradeHref}
							className={cn(buttonVariants())}
							onClick={() => {
								trackEvent(
									upgradeEvent,
									{
										source: "usage_limit",
									},
									{ sendImmediately: true },
								);
							}}
						>
							{upgradeLabel}
						</a>
					) : null}
					{isPaid && mailtoHref ? (
						<a
							href={mailtoHref}
							className={cn(buttonVariants())}
						>
							Ping me
						</a>
					) : null}
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
