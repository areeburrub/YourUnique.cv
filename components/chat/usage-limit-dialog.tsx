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
import type { UsageStatusResponse } from "@/lib/usage-status";
import { cn } from "@/lib/utils";

type UsageLimitDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	status: UsageStatusResponse;
};

function formatResetAt(resetAt: string | null) {
	if (!resetAt) {
		return null;
	}
	const date = new Date(resetAt);
	if (Number.isNaN(date.getTime())) {
		return null;
	}
	return date.toLocaleString(undefined, {
		timeZone: "UTC",
		hour: "2-digit",
		minute: "2-digit",
		month: "short",
		day: "numeric",
		timeZoneName: "short",
	});
}

export function UsageLimitDialog({
	open,
	onOpenChange,
	status,
}: UsageLimitDialogProps) {
	const isPro = isProPlan(status.plan.id);
	const resetLabel = formatResetAt(status.resetAt);
	const supportEmail = status.supportEmail;

	const title =
		status.scope === "daily"
			? "Daily limit reached"
			: "Usage limit reached";

	const description =
		status.scope === "daily"
			? resetLabel
				? `You've hit today's limit. It resets at ${resetLabel}.`
				: "You've hit today's limit."
			: "You've reached your usage limit for now.";

	const actionHint = isPro
		? supportEmail
			? `Need more? Email ${supportEmail}.`
			: "Need more? Contact support."
		: "Upgrade to Pro for a higher limit.";

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
						{description} {actionHint}
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
							Contact support
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
