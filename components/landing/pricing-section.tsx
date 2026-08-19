import { CheckIcon } from "@phosphor-icons/react/ssr";

import { SlideButton } from "@/components/landing/slide-button";
import { authPageHref, SIGNUP_PLAN_LIFETIME } from "@/lib/auth-redirect";
import { PLAN_COPY, PRO_PRICE_USD, TRIAL_DAYS } from "@/lib/plan-copy";
import { cn } from "@/lib/utils";

const plans = [
	{
		...PLAN_COPY.PRO,
		href: "/sign-up",
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
					<h2 className="font-display mt-4 text-[40px] leading-[48px] font-semibold tracking-[-0.8px] text-foreground sm:whitespace-nowrap sm:text-[48px] sm:leading-[56px] sm:tracking-[-0.96px]">
						{TRIAL_DAYS} days to try, or pay once.
					</h2>
					<p className="mt-4 max-w-[520px] text-base leading-7 text-muted-foreground">
						Pro is ${PRO_PRICE_USD} a month after the trial.
						Lifetime is $150 once.
					</p>
				</div>

				<div className="grid gap-5 md:grid-cols-2">
					{plans.map((plan) => (
						<article
							key={plan.name}
							className={cn(
								"relative flex flex-col rounded-[32px] px-7 py-8 sm:px-9 sm:py-10",
								plan.featured
									? "bg-pastel-blush"
									: "bg-card",
							)}
						>
							<div className="flex items-start justify-between gap-3">
								<p className="text-[22px] leading-8 font-semibold tracking-[-0.3px] text-foreground">
									{plan.name}
								</p>
								<span className="rounded-full bg-brand px-3 py-1 text-[12px] font-medium tracking-[0.04em] text-brand-foreground uppercase">
									{plan.badge}
								</span>
							</div>

							<div className="mt-6 flex items-end gap-2.5">
								<span className="mb-2 font-display text-[28px] leading-8 font-semibold tracking-[-0.4px] text-muted-foreground line-through">
									{plan.compareAt}
								</span>
								<span className="font-display text-[48px] leading-[56px] font-semibold tracking-[-0.96px] text-foreground">
									{plan.price}
								</span>
								<span className="mb-2 text-base text-muted-foreground">
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
										{feature}
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
