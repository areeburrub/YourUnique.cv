"use client";

import { useId, useState, useTransition } from "react";

import { updatePromotionalEmailPreferenceAction } from "@/app/(app)/(shell)/settings/actions";
import { Switch } from "@/components/ui/switch";

export function NotificationSettings({
	promotionalEnabled,
}: {
	promotionalEnabled: boolean;
}) {
	const importantId = useId();
	const updatesId = useId();
	const [promotional, setPromotional] = useState(promotionalEnabled);
	const [pending, startTransition] = useTransition();

	function onProductUpdatesChange(checked: boolean) {
		setPromotional(checked);
		startTransition(async () => {
			const saved = await updatePromotionalEmailPreferenceAction(checked);
			if (saved) {
				setPromotional(saved.emailPromotionalEnabled);
			}
		});
	}

	return (
		<section className="space-y-5 rounded-[28px] bg-card p-7">
			<div>
				<h2 className="font-display text-xl font-semibold tracking-[-0.3px]">
					Email notifications
				</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Turn product updates off here or from the unsubscribe link
					in any mail.
				</p>
			</div>
			<div className="space-y-5">
				<div className="flex items-center justify-between gap-4">
					<div className="min-w-0">
						<p
							id={importantId}
							className="text-sm font-medium text-foreground"
						>
							Important
						</p>
						<p className="mt-1 text-sm text-muted-foreground">
							Always on.
						</p>
					</div>
					<Switch
						checked
						disabled
						aria-labelledby={importantId}
					/>
				</div>
				<div className="flex items-center justify-between gap-4">
					<div className="min-w-0">
						<p
							id={updatesId}
							className="text-sm font-medium text-foreground"
						>
							Product updates
						</p>
						<p className="mt-1 text-sm text-muted-foreground">
							For Offers and Discounts
						</p>
					</div>
					<Switch
						checked={promotional}
						disabled={pending}
						aria-labelledby={updatesId}
						onCheckedChange={onProductUpdatesChange}
					/>
				</div>
			</div>
		</section>
	);
}
