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
import { isProPlan } from "@/lib/plans";
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
	const isPro = isProPlan(status.plan.id);
	const resetLabel = formatDailyResetAt(
		status.resetAt ? new Date(status.resetAt) : nextUtcMidnight(),
	);
	const supportEmail = status.supportEmail;

	const usageLine = status.blocked
		? status.scope === "daily"
			? resetLabel
				? `You've hit today's limit. It resets at ${resetLabel}.`
				: "You've hit today's limit."
			: "You've reached your usage limit for now."
		: resetLabel
			? `You've hit 90% of today's usage. It resets at ${resetLabel}.`
			: "You've hit 90% of today's usage.";

	const title = isPro
		? "You're already on Pro"
		: status.blocked
			? status.scope === "daily"
				? "Daily limit reached"
				: "Usage limit reached"
			: "Upgrade to Pro";

	const checkoutHref = !isPro ? "/api/checkout" : null;

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
						{isPro ? (
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
							"Upgrade to Pro for a higher limit."
						)}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="sm:justify-end">
					{checkoutHref ? (
						<a
							href={checkoutHref}
							className={cn(buttonVariants())}
						>
							Upgrade to Pro
						</a>
					) : null}
					{isPro && mailtoHref ? (
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
