import { Check } from "@phosphor-icons/react/dist/ssr";

import { SlideButton } from "@/components/landing/slide-button";
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
		href: "/sign-up",
		featured: true,
	},
] as const;

export function PricingSection() {
	return (
		<section id="pricing" className="border-b border-border">
			<div className="rail px-4 py-20 sm:px-8 md:px-10 md:py-28">
				<div className="mb-12 max-w-[520px] md:mb-14">
					<h2 className="font-display text-[40px] leading-[48px] font-semibold tracking-[-0.8px] text-foreground sm:text-[48px] sm:leading-[56px] sm:tracking-[-0.96px]">
						Free to start. Pro for $10.
					</h2>
					<p className="mt-4 text-base leading-6 text-muted-foreground">
						Start free, or go Pro when you&apos;re applying
						regularly.
					</p>
				</div>

				<div className="grid border-y border-border md:grid-cols-2">
					{plans.map((plan, index) => (
						<article
							key={plan.name}
							className={cn(
								"relative flex flex-col border-border bg-background px-6 py-8 sm:px-8",
								index > 0 && "border-t md:border-t-0 md:border-l",
								plan.featured && "md:shadow-[inset_0_0_0_1px_var(--brand)]",
							)}
						>
							<div className="flex items-start justify-between gap-3">
								<p className="text-[20px] leading-7 font-semibold tracking-[-0.2px] text-foreground">
									{plan.name}
								</p>
								{"badge" in plan && plan.badge ? (
									<span className="rounded-[6px] bg-brand/10 px-2 py-0.5 text-[12px] font-medium tracking-[-0.14px] text-brand uppercase">
										{plan.badge}
									</span>
								) : null}
							</div>

							<div className="mt-5 flex items-end gap-1">
								<span className="font-display text-[48px] leading-[56px] font-semibold tracking-[-0.96px] text-foreground">
									{plan.price}
								</span>
								{plan.period ? (
									<span className="mb-2 text-base text-muted-foreground">
										{plan.period}
									</span>
								) : null}
							</div>

							<p className="mt-3 min-h-12 text-base leading-6 text-muted-foreground">
								{plan.blurb}
							</p>

							<ul className="mt-8 flex flex-1 flex-col gap-3">
								{plan.features.map((feature) => (
									<li
										key={feature}
										className="flex items-start gap-2.5 text-base leading-6 text-foreground"
									>
										<span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-brand">
											<Check size={12} weight="bold" />
										</span>
										{feature}
									</li>
								))}
							</ul>

							<div className="mt-8">
								<SlideButton
									href={plan.href}
									variant={plan.featured ? "primary" : "outline"}
									className={cn(
										"w-full",
										plan.featured &&
											"border-brand bg-brand text-brand-foreground",
									)}
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
