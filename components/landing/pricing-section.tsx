import { CheckIcon } from "@phosphor-icons/react/ssr";

import { SlideButton } from "@/components/landing/slide-button";
import { authPageHref, SIGNUP_PLAN_PRO } from "@/lib/auth-redirect";
import { PLAN_COPY } from "@/lib/plan-copy";
import { PRO_PRICE_USD } from "@/lib/plans";

export function PricingSection() {
	return (
		<section id="pricing">
			<div className="rail px-5 py-20 sm:px-8 md:px-10 md:py-28">
				<div className="mb-12 md:mb-14">
					<p className="eyebrow !text-brand">Pricing</p>
					<h2 className="font-display mt-4 text-[40px] leading-[48px] font-semibold tracking-[-0.8px] text-foreground sm:text-[48px] sm:leading-[56px] sm:tracking-[-0.96px]">
						Free to start. Pro if you need more.
					</h2>
					<p className="mt-4 max-w-[520px] text-base leading-7 text-muted-foreground">
						Keep a few tailored CVs on Free. Pro is $
						{PRO_PRICE_USD} a month for a higher limit.
						Cancel anytime.
					</p>
				</div>

				<div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2">
					<article className="relative flex min-w-0 flex-col rounded-[32px] bg-card px-6 py-7 sm:px-7 sm:py-8 lg:px-8 lg:py-10">
						<div className="flex items-start justify-between gap-2">
							<p className="text-[22px] leading-8 font-semibold tracking-[-0.3px] text-foreground">
								{PLAN_COPY.FREE.name}
							</p>
							<span className="shrink-0 rounded-full bg-brand px-2.5 py-1 text-[11px] font-medium tracking-[0.04em] text-brand-foreground uppercase sm:px-3 sm:text-[12px]">
								{PLAN_COPY.FREE.badge}
							</span>
						</div>
						<div className="mt-6 flex flex-wrap items-end gap-x-2.5 gap-y-1">
							<span className="font-display text-[40px] leading-none font-semibold tracking-[-0.8px] text-foreground lg:text-[48px] lg:tracking-[-0.96px]">
								{PLAN_COPY.FREE.price}
							</span>
							<span className="mb-1.5 text-base text-muted-foreground">
								{PLAN_COPY.FREE.period}
							</span>
						</div>
						<p className="mt-3 min-h-12 text-base leading-7 text-muted-foreground">
							{PLAN_COPY.FREE.blurb}
						</p>
						<ul className="mt-8 flex flex-1 flex-col gap-3.5">
							{PLAN_COPY.FREE.features.map((feature, index) => (
								<li
									key={feature}
									className="flex items-start gap-3 text-base leading-6 text-foreground"
								>
									<span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
										<CheckIcon size={14} weight="bold" />
									</span>
									<span
										className={
											index === 0
												? "min-w-0 font-semibold"
												: "min-w-0"
										}
									>
										{feature}
									</span>
								</li>
							))}
						</ul>
						<div className="mt-9">
							<SlideButton
								href="/sign-up"
								variant="outline"
								className="w-full"
							>
								{PLAN_COPY.FREE.cta}
							</SlideButton>
						</div>
					</article>

					<article className="relative flex min-w-0 flex-col rounded-[32px] bg-pastel-blush px-6 py-7 sm:px-7 sm:py-8 lg:px-8 lg:py-10">
						<div className="flex items-start justify-between gap-2">
							<p className="text-[22px] leading-8 font-semibold tracking-[-0.3px] text-foreground">
								{PLAN_COPY.PRO.name}
							</p>
							<span className="shrink-0 rounded-full bg-brand px-2.5 py-1 text-[11px] font-medium tracking-[0.04em] text-brand-foreground uppercase sm:px-3 sm:text-[12px]">
								{PLAN_COPY.PRO.badge}
							</span>
						</div>
						<div className="mt-6 flex flex-wrap items-end gap-x-2.5 gap-y-1">
							{PLAN_COPY.PRO.compareAt ? (
								<s className="mb-1 font-display text-[28px] leading-none font-semibold tracking-[-0.4px] text-muted-foreground lg:text-[32px]">
									<span className="sr-only">Was </span>
									{PLAN_COPY.PRO.compareAt}
								</s>
							) : null}
							<span className="font-display text-[40px] leading-none font-semibold tracking-[-0.8px] text-foreground lg:text-[48px] lg:tracking-[-0.96px]">
								{PLAN_COPY.PRO.price}
							</span>
							<span className="mb-1.5 text-base text-muted-foreground">
								{PLAN_COPY.PRO.period}
							</span>
						</div>
						<p className="mt-3 min-h-12 text-base leading-7 text-muted-foreground">
							{PLAN_COPY.PRO.blurb}
						</p>
						<ul className="mt-8 flex flex-1 flex-col gap-3.5">
							{PLAN_COPY.PRO.features.map((feature, index) => (
								<li
									key={feature}
									className="flex items-start gap-3 text-base leading-6 text-foreground"
								>
									<span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
										<CheckIcon size={14} weight="bold" />
									</span>
									<span
										className={
											index === 0
												? "min-w-0 font-semibold"
												: "min-w-0"
										}
									>
										{feature}
									</span>
								</li>
							))}
						</ul>
						<div className="mt-9">
							<SlideButton
								href={authPageHref("/sign-up", SIGNUP_PLAN_PRO)}
								className="w-full"
							>
								{PLAN_COPY.PRO.cta}
							</SlideButton>
						</div>
					</article>
				</div>
			</div>
		</section>
	);
}
