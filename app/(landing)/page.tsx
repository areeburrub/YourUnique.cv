import { ClosingCta } from "@/components/landing/closing-cta";
import { CompanyLogos } from "@/components/landing/company-logos";
import { FeaturesSection } from "@/components/landing/features-section";
import { Hero } from "@/components/landing/hero";
import { PricingSection } from "@/components/landing/pricing-section";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { UniqueFeatures } from "@/components/landing/unique-features";

export default function LandingPage() {
	return (
		<div className="flex flex-1 flex-col bg-background">
			<SiteHeader />

			<main>
				<Hero />

				<CompanyLogos />

				<UniqueFeatures />

				<FeaturesSection />

				<PricingSection />

				<ClosingCta />
			</main>

			<SiteFooter />
		</div>
	);
}
