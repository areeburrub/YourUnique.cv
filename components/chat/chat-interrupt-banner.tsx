"use client";

import { Button } from "@/components/ui/button";

type ChatInterruptBannerProps = {
	onRetry: () => void;
	disabled?: boolean;
};

export function ChatInterruptBanner({
	onRetry,
	disabled = false,
}: ChatInterruptBannerProps) {
	return (
		<div className="mb-2 flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-subtle px-3 py-2">
			<p className="text-sm text-muted-foreground">
				The reply was interrupted.
			</p>
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={onRetry}
				disabled={disabled}
			>
				Retry
			</Button>
		</div>
	);
}
