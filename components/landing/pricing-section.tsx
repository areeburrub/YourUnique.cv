import { CheckIcon } from "@phosphor-icons/react/ssr";

import { SlideButton } from "@/components/landing/slide-button";
import { authPageHref, SIGNUP_PLAN_PRO } from "@/lib/auth-redirect";
import { cn } from "@/lib/utils";

const plans = [
	{
		name: "Free",
		price: "Free",
		period: "",
		blurb: "Best for casual applicants who only need about 10–15 CVs a month.",
		features: [
			"Chat-led resume drafting",
			"Career persona profile",
			"PDF export",
			"About 10–15 resumes / month",
		],
		cta: "Get started",
		href: "/sign-up",
		featured: false,
	},
	{
		name: "Pro",
		price: "$10",
		period: "/month",
		blurb: "For regular applicants who apply often and need 100+ resumes every month.",
		badge: "Recommended",
		features: [
			"Everything in Free",
			"Room for heavy application weeks",
			"Hundreds of resume iterations",
			"100+ resumes / month",
		],
		cta: "Start with Pro",
		href: authPageHref("/sign-up", SIGNUP_PLAN_PRO),
		featured: true,
	},
] as const;

export function PricingSection() {
	return (
		<section id="pricing">
			<div className="rail px-5 py-20 sm:px-8 md:px-10 md:py-28">
				<div className="mb-12 max-w-[520px] md:mb-14">
					<p className="eyebrow !text-brand">Pricing</p>
					<h2 className="font-display mt-4 text-[40px] leading-[48px] font-semibold tracking-[-0.8px] text-foreground sm:text-[48px] sm:leading-[56px] sm:tracking-[-0.96px]">
						Free to start. Pro for $10.
					</h2>
					<p className="mt-4 text-base leading-7 text-muted-foreground">
						Start free, or go Pro when you&apos;re applying
						regularly.
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
								{"badge" in plan && plan.badge ? (
									<span className="rounded-full bg-brand px-3 py-1 text-[12px] font-medium tracking-[0.04em] text-brand-foreground uppercase">
										{plan.badge}
									</span>
								) : null}
							</div>

							<div className="mt-6 flex items-end gap-1">
								<span className="font-display text-[48px] leading-[56px] font-semibold tracking-[-0.96px] text-foreground">
									{plan.price}
								</span>
								{plan.period ? (
									<span className="mb-2 text-base text-muted-foreground">
										{plan.period}
									</span>
								) : null}
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
