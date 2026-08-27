"use client";

import { ArrowRightIcon, CheckCircleIcon, SparkleIcon } from "@phosphor-icons/react";

import { SlideButton } from "@/components/landing/slide-button";
import { MixpanelEvent, trackEvent } from "@/lib/mixpanel";
import { PLAN_COPY, TRIAL_DAYS } from "@/lib/plan-copy";
import type { ToolSlug } from "@/lib/tools/catalog";
import { toolSignupHref } from "@/lib/tools/catalog";

type ToolPromoCtaProps = {
	slug: ToolSlug;
	headline: string;
	body: string;
	button: string;
	source: "result" | "page";
};

export function ToolPromoCta({
	slug,
	headline,
	body,
	button,
	source,
}: ToolPromoCtaProps) {
	const handleClick = () =>
		trackEvent(MixpanelEvent.ToolCtaClicked, { tool: slug, source });

	if (source === "page") {
		return (
			<div className="relative overflow-hidden rounded-[24px] border border-brand/15 bg-pastel-blush px-6 py-6">
				<div
					aria-hidden
					className="absolute -top-10 -right-10 size-28 rounded-full bg-brand/10 blur-2xl"
				/>
				<span className="flex size-10 items-center justify-center rounded-full bg-brand text-brand-foreground">
					<SparkleIcon size={18} weight="fill" />
				</span>
				<p className="font-display mt-4 text-[19px] leading-6 font-semibold tracking-[-0.3px] text-foreground">
					{headline}
				</p>
				<p className="mt-1.5 text-sm leading-6 text-muted-foreground">
					{body}
				</p>
				<ul className="mt-4 space-y-2 border-t border-brand/15 pt-4">
					{PLAN_COPY.TRIAL.features.slice(0, 3).map((feature) => (
						<li
							key={feature}
							className="flex items-start gap-2 text-[13px] leading-5 text-foreground"
						>
							<CheckCircleIcon
								size={16}
								weight="fill"
								className="mt-0.5 shrink-0 text-brand"
							/>
							{feature}
						</li>
					))}
				</ul>
				<SlideButton
					href={toolSignupHref(slug)}
					className="mt-5 h-11 w-full px-5 text-sm"
					onClick={handleClick}
				>
					{button}
				</SlideButton>
				<p className="mt-3 text-center text-xs text-muted-foreground">
					{TRIAL_DAYS}-day trial &middot; no card required
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4 rounded-[24px] bg-pastel-blush px-6 py-6 sm:flex-row sm:items-center sm:gap-5 sm:px-8">
			<p className="font-display min-w-0 flex-1 text-[20px] leading-7 font-semibold tracking-[-0.3px] text-foreground">
				Want me to generate a tailored resume?
			</p>
			<ArrowRightIcon
				size={22}
				weight="bold"
				className="hidden shrink-0 text-brand sm:block"
				aria-hidden
			/>
			<SlideButton
				href={toolSignupHref(slug)}
				className="w-full shrink-0 sm:w-auto"
				onClick={handleClick}
			>
				{button}
			</SlideButton>
		</div>
	);
}
