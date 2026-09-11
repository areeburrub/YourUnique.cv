"use client";

import { Check } from "lucide-react";
import Image from "next/image";

import { ProCheckoutButton } from "@/components/billing/pro-checkout-button";
import { PLAN_COPY } from "@/lib/plan-copy";

const BENEFITS = [
	"Daily matches from live ATS postings",
	"Filter and shortlist from chat",
	"Generate a CV from any role",
];

export function RadarProCard() {
	return (
		<div className="w-full max-w-[min(100%,28rem)] overflow-hidden rounded-2xl border border-border bg-card">
			<div className="relative h-24 w-full">
				<Image
					src="/assets/radar/pro-header-v4.webp"
					alt=""
					fill
					sizes="448px"
					className="object-cover object-[center_35%]"
				/>
				<div
					aria-hidden
					className="absolute inset-0 bg-linear-to-t from-card via-card/20 to-black/20"
				/>
			</div>
			<div className="space-y-3 p-4 pt-3">
				<div>
					<p className="text-[15px] font-medium">Job Radar is on Pro</p>
					<p className="mt-1 text-sm leading-5 text-muted-foreground">
						Upgrade to browse your matches, filter them, and shortlist
						roles from chat.
					</p>
				</div>
				<ul className="space-y-1.5">
					{BENEFITS.map((benefit) => (
						<li key={benefit} className="flex items-start gap-2 text-sm">
							<span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
								<Check size={10} />
							</span>
							<span>{benefit}</span>
						</li>
					))}
				</ul>
				<div className="flex items-end justify-between gap-2">
					<p className="text-sm text-muted-foreground">
						<span className="font-display text-xl font-semibold tracking-[-0.4px] text-foreground">
							{PLAN_COPY.PRO.price}
						</span>
						{PLAN_COPY.PRO.period}
					</p>
				</div>
				<ProCheckoutButton
					source="job_radar_chat"
					label="Upgrade to Pro"
				/>
			</div>
		</div>
	);
}
