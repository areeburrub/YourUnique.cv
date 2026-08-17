"use client";

import { XIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	formatDailyResetAt,
	isNearDailyLimit,
	nextUtcMidnight,
	utcDateString,
	type UsageStatusResponse,
} from "@/lib/usage-status";

const DISMISS_KEY_PREFIX = "daily-usage-warning:";

type DailyUsageWarningProps = {
	status: UsageStatusResponse;
	onUpgrade: () => void;
};

function dismissKey(date: string) {
	return `${DISMISS_KEY_PREFIX}${date}`;
}

function wasDismissed(date: string) {
	try {
		return window.localStorage.getItem(dismissKey(date)) === "1";
	} catch {
		return false;
	}
}

function dismiss(date: string) {
	try {
		window.localStorage.setItem(dismissKey(date), "1");
	} catch {
		return;
	}
}

export function DailyUsageWarning({
	status,
	onUpgrade,
}: DailyUsageWarningProps) {
	const today = utcDateString();
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (!isNearDailyLimit(status)) {
			setOpen(false);
			return;
		}
		setOpen(!wasDismissed(today));
	}, [status, today]);

	if (!open) {
		return null;
	}

	const resetLabel = formatDailyResetAt(nextUtcMidnight());

	return (
		<div
			role="status"
			className="relative mb-2 flex w-full flex-col gap-2 rounded-lg border border-border bg-surface-subtle px-3 py-2.5 pr-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:pr-3"
		>
			<p className="min-w-0 flex-1 text-pretty leading-5">
				You've hit 90% of today's usage
				{resetLabel ? `. Resets at ${resetLabel}.` : "."}
			</p>
			<div className="flex items-center gap-1">
				<Button
					type="button"
					size="xs"
					className="w-auto"
					onClick={onUpgrade}
				>
					Upgrade
				</Button>
				<button
					type="button"
					onClick={() => {
						dismiss(today);
						setOpen(false);
					}}
					className="absolute top-1.5 right-1.5 flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground sm:static"
					aria-label="Dismiss daily usage warning"
				>
					<XIcon size={14} weight="bold" />
				</button>
			</div>
		</div>
	);
}
