"use client";

import { ArrowUpIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { MixpanelEvent, trackEvent } from "@/lib/mixpanel";
import { PRODUCT_HUNT_UPVOTE_HREF } from "@/lib/product-hunt";
import {
	completeProductHuntUpvote,
	productHuntSnoozeRemainingMs,
	shouldShowProductHuntUpvote,
	snoozeProductHuntUpvote,
} from "@/lib/product-hunt-prompt";
import { cn } from "@/lib/utils";

import { useHasReadyResume } from "@/components/app/has-ready-resume";

function ProductHuntMark() {
	return (
		<span
			className="flex size-9 shrink-0 items-center justify-center rounded-xl text-white"
			style={{ backgroundColor: "#DA552F" }}
			aria-hidden
		>
			<svg viewBox="0 0 40 40" className="size-5" fill="none">
				<path
					d="M22.667 20H16.667V13.333H22.667C24.508 13.333 26 14.826 26 16.667C26 18.508 24.508 20 22.667 20ZM22.667 9H12.667V31H16.667V24H22.667C26.716 24 30 20.716 30 16.667C30 12.618 26.716 9 22.667 9Z"
					fill="currentColor"
				/>
			</svg>
		</span>
	);
}

export function ProductHuntUpvoteBanner({ className }: { className?: string }) {
	const hasReadyResume = useHasReadyResume();
	const [visible, setVisible] = useState(false);
	const [clock, setClock] = useState(0);
	const shownRef = useRef(false);

	useEffect(() => {
		function sync() {
			const next = shouldShowProductHuntUpvote(hasReadyResume);
			setVisible(next);
			if (next && !shownRef.current) {
				shownRef.current = true;
				trackEvent(MixpanelEvent.ProductHuntPromptShown);
			}
		}

		sync();
		const remaining = productHuntSnoozeRemainingMs();
		if (remaining <= 0) {
			return;
		}
		const timer = window.setTimeout(() => {
			shownRef.current = false;
			setClock((value) => value + 1);
		}, remaining);
		return () => window.clearTimeout(timer);
	}, [clock, hasReadyResume]);

	if (!visible) {
		return null;
	}

	const upvoteHandler = () => {
		completeProductHuntUpvote();
		shownRef.current = true;
		setVisible(false);
		trackEvent(MixpanelEvent.ProductHuntPromptClicked);
	};

	const snoozeHandler = () => {
		snoozeProductHuntUpvote();
		shownRef.current = false;
		setVisible(false);
		setClock((value) => value + 1);
		trackEvent(MixpanelEvent.ProductHuntPromptSnoozed);
	};

	return (
		<div
			role="status"
			className={cn(
				"flex w-full flex-col gap-3 rounded-2xl border border-border bg-card px-3.5 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between",
				className,
			)}
		>
			<div className="flex min-w-0 items-start gap-3 sm:flex-1 sm:items-center">
				<ProductHuntMark />
				<div className="min-w-0 flex-1 pt-0.5 sm:pt-0">
					<p className="text-sm font-medium text-foreground">
						We&apos;re live on Product Hunt
					</p>
					<p className="text-pretty text-xs leading-5 text-muted-foreground sm:truncate">
						Enjoyed your resume? An upvote helps others find us.
					</p>
				</div>
				<button
					type="button"
					onClick={snoozeHandler}
					className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground sm:hidden"
					aria-label="Remind me later"
				>
					<XIcon size={14} weight="bold" />
				</button>
			</div>
			<div className="flex shrink-0 items-center gap-2">
				<a
					href={PRODUCT_HUNT_UPVOTE_HREF}
					target="_blank"
					rel="noopener noreferrer"
					className={cn(
						buttonVariants({ size: "sm" }),
						"w-full gap-1.5 sm:w-auto",
					)}
					onClick={upvoteHandler}
				>
					<ArrowUpIcon size={14} weight="bold" />
					Upvote
				</a>
				<button
					type="button"
					onClick={snoozeHandler}
					className="hidden size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground sm:flex"
					aria-label="Remind me later"
				>
					<XIcon size={14} weight="bold" />
				</button>
			</div>
		</div>
	);
}
