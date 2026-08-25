"use client";

import { ArrowUpIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

import { useHasReadyResume } from "@/components/app/has-ready-resume";
import { PeerlistLogo } from "@/components/peerlist-logo";
import { buttonVariants } from "@/components/ui/button";
import { MixpanelEvent, trackEvent } from "@/lib/mixpanel";
import { PEERLIST_UPVOTE_HREF } from "@/lib/peerlist";
import {
	completePeerlistUpvote,
	peerlistSnoozeRemainingMs,
	shouldShowPeerlistUpvote,
	snoozePeerlistUpvote,
} from "@/lib/peerlist-prompt";
import { cn } from "@/lib/utils";

function PeerlistMark() {
	return <PeerlistLogo className="size-9" />;
}

export function PeerlistUpvoteBanner({ className }: { className?: string }) {
	const hasReadyResume = useHasReadyResume();
	const [visible, setVisible] = useState(false);
	const [clock, setClock] = useState(0);
	const shownRef = useRef(false);

	useEffect(() => {
		function sync() {
			const next = shouldShowPeerlistUpvote(hasReadyResume);
			setVisible(next);
			if (next && !shownRef.current) {
				shownRef.current = true;
				trackEvent(MixpanelEvent.PeerlistPromptShown);
			}
		}

		sync();
		const remaining = peerlistSnoozeRemainingMs();
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
		completePeerlistUpvote();
		shownRef.current = true;
		setVisible(false);
		trackEvent(MixpanelEvent.PeerlistPromptClicked);
	};

	const snoozeHandler = () => {
		snoozePeerlistUpvote();
		shownRef.current = false;
		setVisible(false);
		setClock((value) => value + 1);
		trackEvent(MixpanelEvent.PeerlistPromptSnoozed);
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
				<PeerlistMark />
				<div className="min-w-0 flex-1 pt-0.5 sm:pt-0">
					<p className="text-sm font-medium text-foreground">
						We&apos;re live on Peerlist
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
					href={PEERLIST_UPVOTE_HREF}
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
