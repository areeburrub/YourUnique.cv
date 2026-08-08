import { ChatCircle, ChartLineUp, FilePdf } from "@phosphor-icons/react/dist/ssr";
import { FeaturesSection } from "@/components/landing/features-section";
import { Hero } from "@/components/landing/hero";
import { PersonaSnapshot } from "@/components/landing/persona-snapshot";
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
	"Chat memory",
];

const iconFeatures = [
	{
		title: "Chat-led tailoring",
		body: "Paste a job description and steer the draft in chat. The agent analyzes, rewrites, and shows every step.",
		Icon: ChatCircle,
	},
	{
		title: "Proof that fits the role",
		body: "Matching wins move up and noise drops out. You stay in control of what makes the final page.",
		Icon: ChartLineUp,
	},
	{
		title: "Clean PDF export",
		body: "Compile a professional file when ready. Keep a tailored version for every role you apply to.",
		Icon: FilePdf,
	},
];

export default function LandingPage() {
	return (
		<div className="flex flex-1 flex-col bg-background">
			<SiteHeader />

			<main>
				<Hero />

				<section className="border-b border-border">
					<div className="rail overflow-hidden py-8">
						<div className="relative overflow-hidden">
							<div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
							<div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
							<div className="animate-marquee flex w-max gap-12 whitespace-nowrap">
								{[...proofItems, ...proofItems].map((item, index) => (
									<span
										key={`${item}-${index}`}
										className="text-[14px] font-medium tracking-[-0.14px] text-muted-soft uppercase"
									>
										{item}
									</span>
								))}
							</div>
						</div>
					</div>
				</section>

				<FeaturesSection />

				<section id="persona" className="border-b border-border">
					<div className="rail px-4 py-20 sm:px-8 md:px-10 md:py-28">
						<div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
							<div>
								<p className="eyebrow">Your journey, remembered</p>
								<h2 className="font-display mt-4 max-w-[420px] text-[40px] leading-[48px] font-semibold tracking-[-0.8px] text-foreground sm:text-[48px] sm:leading-[56px] sm:tracking-[-0.96px]">
									A persona that grows with your career
								</h2>
								<p className="mt-5 max-w-[400px] text-base leading-6 text-muted-foreground">
									Roles, impact, skills, side work: stored as
									one profile the agent can draw from. Update it
									when life moves; stop rebuilding resumes from
									scratch.
								</p>
								<ul className="mt-8 space-y-4">
									{[
										"Keeps context across applications",
										"Surfaces the right proof for each posting",
										"Lets you refine sections in chat before export",
									].map((item) => (
										<li
											key={item}
											className="flex items-center gap-3 text-base font-medium text-foreground"
										>
											<span className="flex size-5 items-center justify-center rounded-[4px] bg-brand/10 text-[12px] text-brand">
												✓
											</span>
											{item}
										</li>
									))}
								</ul>
							</div>
							<PersonaSnapshot />
						</div>
						<div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
							{iconFeatures.map(({ title, body, Icon }) => (
								<div key={title}>
									<span className="flex size-11 items-center justify-center rounded-[10px] bg-surface-subtle text-foreground">
										<Icon size={22} weight="bold" />
									</span>
									<h3 className="mt-5 text-[18px] leading-6 font-semibold tracking-[-0.2px] text-foreground">
										{title}
									</h3>
									<p className="mt-2 line-clamp-3 min-h-[4.5rem] text-base leading-6 text-muted-foreground">
										{body}
									</p>
								</div>
							))}
						</div>
					</div>
				</section>

				<PricingSection />

				<section className="border-b border-border">
					<div className="rail">
						<div className="relative overflow-hidden bg-brand px-4 py-24 text-center sm:px-8 md:px-10 md:py-[140px]">
							<div
								aria-hidden="true"
								className="pointer-events-none absolute inset-0 bg-[linear-gradient(#5991f600,#5991f6cc_26%,#5991f6db_44%,#2471fff2_72%,#2471ff)] opacity-40"
							/>
							<div className="relative mx-auto max-w-[520px]">
								<h2 className="font-display text-[40px] leading-[48px] font-semibold tracking-[-0.8px] text-white sm:text-[48px] sm:leading-[56px] sm:tracking-[-0.96px]">
									Show up as the candidate this job needs
								</h2>
								<p className="mt-4 text-base leading-6 text-white/70">
									Bring your full career. Leave with a resume
									written for this application, not last year’s
									template.
								</p>
								<div className="mt-8 flex justify-center">
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
