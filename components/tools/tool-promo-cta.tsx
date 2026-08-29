"use client";

import { ArrowRightIcon, CheckIcon, SparkleIcon } from "@phosphor-icons/react";

import { SlideButton } from "@/components/landing/slide-button";
import { MixpanelEvent, trackEvent } from "@/lib/mixpanel";
import { PLAN_COPY } from "@/lib/plan-copy";
import type { ToolSlug } from "@/lib/tools/catalog";
import { toolSignupHref } from "@/lib/tools/catalog";

const PROMO_FEATURES = [
	"Tailored CV for the job in front of you",
	"AI Agent for Resume",
	PLAN_COPY.FREE.features[2],
] as const;

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
			<div className="product-shadow relative overflow-hidden rounded-media bg-pastel-blush px-6 py-6">
				<div
					aria-hidden
					className="absolute -top-14 -right-10 size-40 rounded-full bg-brand/10 blur-3xl"
				/>
				<div className="relative">
					<span className="flex size-10 items-center justify-center rounded-full bg-brand text-brand-foreground">
						<SparkleIcon size={18} weight="fill" />
					</span>
					<p className="font-display mt-4 text-[19px] leading-6 font-semibold tracking-[-0.3px] text-foreground">
						{headline}
					</p>
					<p className="mt-1.5 text-sm leading-6 text-muted-foreground">
						{body}
					</p>
					<ul className="mt-5 space-y-2.5">
						{PROMO_FEATURES.map((feature) => (
							<li
								key={feature}
								className="flex items-start gap-2.5 text-[13px] leading-5 text-foreground"
							>
								<span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
									<CheckIcon size={11} weight="bold" />
								</span>
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
						Free to start &middot; no card required
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4 rounded-media bg-pastel-blush px-6 py-6 sm:flex-row sm:items-center sm:gap-5 sm:px-8">
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
