import { FeaturesSection } from "@/components/landing/features-section";
import { Hero } from "@/components/landing/hero";
import { PricingSection } from "@/components/landing/pricing-section";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { SlideButton } from "@/components/landing/slide-button";

const proofItems = [
	"Career persona",
	"Job-aware drafts",
	"Agent tool calls",
	"Version history",
	"PDF export",
	"ATS analysis",
	"Chat memory",
];

export default function LandingPage() {
	return (
		<div className="flex flex-1 flex-col bg-background">
			<SiteHeader />

			<main>
				<Hero />

				<section>
					<div className="rail overflow-hidden px-5 py-8 sm:px-8 md:px-10">
						<div className="relative overflow-hidden rounded-full bg-card px-4 py-4">
							<div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-card to-transparent" />
							<div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-card to-transparent" />
							<div className="animate-marquee flex w-max gap-14 whitespace-nowrap">
								{[...proofItems, ...proofItems].map((item, index) => (
									<span
										key={`${item}-${index}`}
										className="text-[14px] font-medium tracking-[0.06em] text-muted-foreground uppercase"
									>
										{item}
									</span>
								))}
							</div>
						</div>
					</div>
				</section>

				<FeaturesSection />

				<PricingSection />

				<section>
					<div className="rail px-5 pb-20 sm:px-8 md:px-10 md:pb-28">
						<div className="relative overflow-hidden rounded-[36px] bg-brand px-6 py-20 text-center sm:px-10 md:py-28">
							<div className="relative mx-auto max-w-[520px]">
								<h2 className="font-display text-[40px] leading-[48px] font-semibold tracking-[-0.8px] text-white sm:text-[48px] sm:leading-[56px] sm:tracking-[-0.96px]">
									Show up as the candidate this job needs
								</h2>
								<p className="mt-4 text-base leading-7 text-white/75">
									Bring your full career. Leave with a resume
									written for this application, not last year’s
									template.
								</p>
								<div className="mt-9 flex justify-center">
									<SlideButton href="/sign-up" variant="on-brand">
										Create your persona
									</SlideButton>
								</div>
							</div>
						</div>
					</div>
				</section>
			</main>

			<SiteFooter />
		</div>
	);
}
