"use client";

import Image from "next/image";
import { Check, X } from "lucide-react";

import { ProCheckoutButton } from "@/components/billing/pro-checkout-button";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { PLAN_COPY } from "@/lib/plan-copy";

const RADAR_PRO_BENEFITS = [
	"200+ new role recommendations, refreshed regularly",
	"Daily Job Radar search with alerts for new matches",
	"Company, location, and why each role matches you",
	"Generate a tailored CV from any posting",
];

export function JobRadarProDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="gap-0 overflow-hidden p-0 sm:max-w-md"
				showCloseButton={false}
			>
				<div className="relative h-32 w-full sm:h-36">
					<Image
						src="/assets/radar/pro-header-v4.webp"
						alt=""
						fill
						sizes="(max-width: 640px) 100vw, 448px"
						className="object-cover object-[center_35%]"
					/>
					<div
						aria-hidden
						className="absolute inset-0 bg-linear-to-t from-popover via-popover/10 to-black/30"
					/>
					<DialogClose
						render={
							<Button
								variant="ghost"
								size="icon-sm"
								className="absolute top-2 right-2 bg-black/30 text-white hover:bg-black/40 hover:text-white"
							/>
						}
					>
						<X size={16} />
						<span className="sr-only">Close</span>
					</DialogClose>
				</div>

				<div className="space-y-4 p-4 pt-3">
					<DialogHeader>
						<DialogTitle>Unlock Job Radar with Pro</DialogTitle>
						<DialogDescription>
							See the full shortlist and get new matches every day — not just
							a one-time teaser.
						</DialogDescription>
					</DialogHeader>

					<ul className="space-y-2.5">
						{RADAR_PRO_BENEFITS.map((benefit) => (
							<li key={benefit} className="flex items-start gap-2.5 text-sm">
								<span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
									<Check size={12} />
								</span>
								<span>{benefit}</span>
							</li>
						))}
					</ul>

					<div className="rounded-lg bg-pastel-blush px-4 py-3">
						<div className="flex items-center justify-between gap-2">
							<p className="text-sm font-medium">{PLAN_COPY.PRO.name}</p>
							<span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-medium tracking-[0.04em] text-brand-foreground uppercase">
								{PLAN_COPY.PRO.badge}
							</span>
						</div>
						<div className="mt-2 flex flex-wrap items-end gap-x-2 gap-y-1">
							{PLAN_COPY.PRO.compareAt ? (
								<s className="font-display text-lg font-semibold tracking-[-0.3px] text-muted-foreground">
									<span className="sr-only">Was </span>
									{PLAN_COPY.PRO.compareAt}
								</s>
							) : null}
							<span className="font-display text-3xl font-semibold tracking-[-0.6px] text-foreground">
								{PLAN_COPY.PRO.price}
							</span>
							<span className="mb-0.5 text-sm text-muted-foreground">
								{PLAN_COPY.PRO.period}
							</span>
						</div>
						<p className="mt-1 text-xs text-muted-foreground">
							Cancel anytime.
						</p>
					</div>

					<ProCheckoutButton
						source="job_radar_locked"
						label="Upgrade to Pro"
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}
