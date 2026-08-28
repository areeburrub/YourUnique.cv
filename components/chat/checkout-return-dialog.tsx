"use client";

import { ArrowRightIcon, ConfettiIcon } from "@phosphor-icons/react";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";

export type CheckoutReturnState = {
	status?: string | null;
	subscriptionId?: string | null;
	paymentId?: string | null;
};

function checkoutCopy(state: CheckoutReturnState) {
	const status = state.status?.trim().toLowerCase() ?? "";
	const paid =
		status === "active" ||
		status === "succeeded" ||
		Boolean(state.subscriptionId) ||
		Boolean(state.paymentId);
	if (!paid) {
		return null;
	}

	return {
		eyebrow: "Pro",
		title: "You're in",
		body: "You're on Pro. Paste a job and we'll write a resume for it.",
	};
}

function fireCheckoutConfetti() {
	const defaults = {
		startVelocity: 32,
		spread: 360,
		ticks: 80,
		zIndex: 80,
		colors: ["#C23B2E", "#E36A58", "#F5F0EA", "#1C1816"],
	};
	confetti({
		...defaults,
		particleCount: 110,
		origin: { x: 0.22, y: 0.32 },
	});
	confetti({
		...defaults,
		particleCount: 110,
		origin: { x: 0.78, y: 0.32 },
	});
}

export function CheckoutReturnDialog({
	checkoutReturn,
}: {
	checkoutReturn: CheckoutReturnState;
}) {
	const router = useRouter();
	const copy = checkoutCopy(checkoutReturn);
	const [open, setOpen] = useState(Boolean(copy));

	useEffect(() => {
		if (!open) {
			return;
		}
		const timer = window.setTimeout(() => {
			fireCheckoutConfetti();
		}, 180);
		return () => window.clearTimeout(timer);
	}, [open]);

	function close() {
		setOpen(false);
		router.replace("/new-chat", { scroll: false });
	}

	if (!copy) {
		return null;
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) {
					close();
				}
			}}
		>
			<DialogContent
				showCloseButton={false}
				className="overflow-hidden rounded-[28px] p-0 sm:max-w-[420px]"
			>
				<div className="bg-pastel-blush px-7 pt-9 pb-8 text-center">
					<span className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-[0_10px_24px_rgba(194,59,46,0.28)]">
						<ConfettiIcon size={28} weight="fill" />
					</span>
					<p className="mt-5 text-[12px] font-medium tracking-[0.08em] text-brand uppercase">
						{copy.eyebrow}
					</p>
					<DialogTitle className="font-display mt-2 text-[32px] leading-9 font-semibold tracking-[-0.64px] text-foreground">
						{copy.title}
					</DialogTitle>
					<DialogDescription className="mx-auto mt-3 max-w-[280px] text-base leading-6 text-muted-foreground">
						{copy.body}
					</DialogDescription>
				</div>
				<div className="border-t border-border bg-background px-7 py-5">
					<Button
						type="button"
						size="lg"
						onClick={close}
						className="h-12 w-full bg-brand text-base font-semibold text-brand-foreground hover:bg-brand/90"
					>
						Write a resume
						<ArrowRightIcon size={16} weight="bold" />
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
