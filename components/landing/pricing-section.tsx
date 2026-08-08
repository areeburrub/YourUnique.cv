import { Check } from "@phosphor-icons/react/dist/ssr";

import { SlideButton } from "@/components/landing/slide-button";
import { cn } from "@/lib/utils";

const plans = [
	{
		name: "Self-host",
		price: "Free",
		period: "",
		blurb: "Open source. Run it on your own stack with your own keys.",
		features: [
			"Full source code",
			"Deploy on your infrastructure",
			"Bring your own API keys",
			"Unlimited generation on your tokens",
			"Chat, persona, and PDF export",
		],
		cta: "Self-host",
		href: "https://github.com/areeburrub/yourunique.cv",
		featured: false,
	},
	{
		name: "Hosted",
		price: "$20",
		period: "/month",
		blurb: "Managed platform with tokens for 50+ CVs a month, plus chat and the full flow.",
		badge: "Recommended",
		features: [
			"Hosted platform — no setup",
			"Tokens for 50+ CVs / month",
			"Chat-led drafting",
			"Career persona profile",
			"PDF export & version history",
		],
		cta: "Get started",
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
						Open source free. Hosted for $20.
					</h2>
					<p className="mt-4 text-base leading-6 text-muted-foreground">
						Self-host with your own keys, or use the managed
						platform with tokens for 50+ CVs a month.
					</p>
				</div>

				<div className="grid border-y border-border md:grid-cols-2">
					{plans.map((plan, index) => (
						<article
							key={plan.name}
							className={cn(
								"flex flex-col border-border px-6 py-8 sm:px-8",
								index > 0 && "border-t md:border-t-0 md:border-l",
								plan.featured && "bg-primary text-primary-foreground",
							)}
						>
							<div className="flex items-start justify-between gap-3">
								<p
									className={cn(
										"text-[20px] leading-7 font-semibold tracking-[-0.2px]",
										plan.featured
											? "text-primary-foreground"
											: "text-foreground",
									)}
								>
									{plan.name}
								</p>
								{"badge" in plan && plan.badge ? (
									<span
										className={cn(
											"rounded-[6px] px-2 py-0.5 text-[12px] font-medium tracking-[-0.14px] uppercase",
											plan.featured
												? "bg-white/15 text-primary-foreground"
												: "bg-brand/10 text-brand",
										)}
									>
										{plan.badge}
									</span>
								) : null}
							</div>

							<div className="mt-5 flex items-end gap-1">
								<span
									className={cn(
										"font-display text-[48px] leading-[56px] font-semibold tracking-[-0.96px]",
										plan.featured
											? "text-primary-foreground"
											: "text-foreground",
									)}
								>
									{plan.price}
								</span>
								{plan.period ? (
									<span
										className={cn(
											"mb-2 text-base",
											plan.featured
												? "text-primary-foreground/70"
												: "text-muted-foreground",
										)}
									>
										{plan.period}
									</span>
								) : null}
							</div>

							<p
								className={cn(
									"mt-3 min-h-[48px] text-base leading-6",
									plan.featured
										? "text-primary-foreground/70"
										: "text-muted-foreground",
								)}
							>
								{plan.blurb}
							</p>

							<ul className="mt-8 flex flex-1 flex-col gap-3">
								{plan.features.map((feature) => (
									<li
										key={feature}
										className={cn(
											"flex items-start gap-2.5 text-base leading-6",
											plan.featured
												? "text-primary-foreground"
												: "text-foreground",
										)}
									>
										<span
											className={cn(
												"mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
												plan.featured
													? "bg-white/15 text-primary-foreground"
													: "bg-surface-subtle text-foreground",
											)}
										>
											<Check size={12} weight="bold" />
										</span>
										{feature}
									</li>
								))}
							</ul>

							<div className="mt-8">
								<SlideButton
									href={plan.href}
									variant={plan.featured ? "on-brand" : "primary"}
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
