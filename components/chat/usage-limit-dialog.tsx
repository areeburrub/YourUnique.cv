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
import { isPaidPlan } from "@/lib/plans";
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
				: "You've used this month's trial resumes."
		: resetLabel
			? `You've hit 90% of today's usage. It resets at ${resetLabel}.`
			: "You've hit 90% of today's usage.";

	const title = isPaid
		? `You're already on ${status.plan.name}`
		: status.blocked
			? status.scope === "daily"
				? "Daily limit reached"
				: "Usage limit reached"
			: "Start your 7-day trial";

	const checkoutHref = !isPaid ? "/api/checkout" : null;

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
						) : (
							"Start your 7-day trial to keep tailoring."
						)}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="sm:justify-end">
					{checkoutHref ? (
						<a
							href={checkoutHref}
							className={cn(buttonVariants())}
							onClick={() => {
								trackEvent(
									MixpanelEvent.CheckoutStarted,
									{
										source: "usage_limit",
									},
									{ sendImmediately: true },
								);
							}}
						>
							Start 7-day trial
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
