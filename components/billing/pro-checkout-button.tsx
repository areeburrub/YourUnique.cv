"use client";

import { MixpanelCheckoutLink } from "@/components/mixpanel-checkout-link";
import { buttonVariants } from "@/components/ui/button";
import { checkoutPath, PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

export function ProCheckoutButton({
	source,
	label = "Get Pro",
	variant = "default",
}: {
	source: string;
	label?: string;
	variant?: "default" | "outline";
}) {
	return (
		<MixpanelCheckoutLink
			href={checkoutPath(PlanId.PRO)}
			source={source}
			className={cn(
				buttonVariants({
					variant: variant === "outline" ? "outline" : "default",
				}),
				"w-full",
			)}
		>
			{label}
		</MixpanelCheckoutLink>
	);
}
