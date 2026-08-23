import { CheckIcon } from "@phosphor-icons/react/ssr";

import { SlideButton } from "@/components/landing/slide-button";
import { authPageHref, SIGNUP_PLAN_LIFETIME, SIGNUP_PLAN_PRO } from "@/lib/auth-redirect";
import { PLAN_COPY, PRO_PRICE_USD, TRIAL_DAYS } from "@/lib/plan-copy";
import { cn } from "@/lib/utils";

const plans = [
	{
		...PLAN_COPY.TRIAL,
		href: "/sign-up",
		featured: false,
	},
	{
		...PLAN_COPY.PRO,
		href: authPageHref("/sign-up", SIGNUP_PLAN_PRO),
		featured: true,
	},
	{
		...PLAN_COPY.LIFETIME,
		href: authPageHref("/sign-up", SIGNUP_PLAN_LIFETIME),
		featured: false,
	},
] as const;

export function PricingSection() {
	return (
		<section id="pricing">
			<div className="rail px-5 py-20 sm:px-8 md:px-10 md:py-28">
				<div className="mb-12 md:mb-14">
					<p className="eyebrow !text-brand">Pricing</p>
					<h2 className="font-display mt-4 text-[40px] leading-[48px] font-semibold tracking-[-0.8px] text-foreground sm:text-[48px] sm:leading-[56px] sm:tracking-[-0.96px]">
						{TRIAL_DAYS} days free. Then pick a plan.
					</h2>
					<p className="mt-4 max-w-[520px] text-base leading-7 text-muted-foreground">
						Trial is free for {TRIAL_DAYS} days, no card. Pro is
						${PRO_PRICE_USD} a month. Lifetime is $150 once.
					</p>
				</div>

				<div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3">
					{plans.map((plan) => (
						<article
							key={plan.name}
							className={cn(
								"relative flex min-w-0 flex-col rounded-[32px] px-6 py-7 sm:px-7 sm:py-8 lg:px-8 lg:py-10",
								plan.featured ? "bg-pastel-blush" : "bg-card",
							)}
						>
							<div className="flex items-start justify-between gap-2">
								<p className="text-[22px] leading-8 font-semibold tracking-[-0.3px] text-foreground">
									{plan.name}
								</p>
								<span className="shrink-0 rounded-full bg-brand px-2.5 py-1 text-[11px] font-medium tracking-[0.04em] text-brand-foreground uppercase sm:px-3 sm:text-[12px]">
									{plan.badge}
								</span>
							</div>

							<div className="mt-6 flex flex-wrap items-end gap-x-2.5 gap-y-1">
								{"compareAt" in plan && plan.compareAt ? (
									<span className="mb-1.5 font-display text-[22px] leading-7 font-semibold tracking-[-0.4px] text-muted-foreground line-through lg:text-[28px] lg:leading-8">
										{plan.compareAt}
									</span>
								) : null}
								<span className="font-display text-[40px] leading-none font-semibold tracking-[-0.8px] text-foreground lg:text-[48px] lg:tracking-[-0.96px]">
									{plan.price}
								</span>
								<span className="mb-1.5 text-base text-muted-foreground">
									{plan.period}
								</span>
							</div>

							<p className="mt-3 min-h-12 text-base leading-7 text-muted-foreground">
								{plan.blurb}
							</p>

							<ul className="mt-8 flex flex-1 flex-col gap-3.5">
								{plan.features.map((feature) => (
									<li
										key={feature}
										className="flex items-start gap-3 text-base leading-6 text-foreground"
									>
										<span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
											<CheckIcon size={14} weight="bold" />
										</span>
										<span className="min-w-0">{feature}</span>
									</li>
								))}
							</ul>

							<div className="mt-9">
								<SlideButton
									href={plan.href}
									variant={plan.featured ? "primary" : "outline"}
									className="w-full"
								>
									{plan.cta}
								</SlideButton>
							</div>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}
