import { SatelliteDish } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ClosingCta } from "@/components/landing/closing-cta";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { SlideButton } from "@/components/landing/slide-button";
import { authPageHref } from "@/lib/auth-redirect";
import { SITE_NAME } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
	title: "Job Radar",
	description:
		"Match your career profile against hundreds of thousands of live ATS postings. Free gets one promo list. Pro gets daily new roles and Generate CV for each match.",
	alternates: {
		canonical: "/job-radar",
	},
	openGraph: {
		type: "website",
		title: `Job Radar | ${SITE_NAME}`,
		description:
			"Daily job matches from a live ATS corpus, ranked like a screen. Open Job Radar after you build your profile.",
		url: "/job-radar",
	},
};

const steps = [
	{
		title: "Finish your career profile",
		body: "Radar reads the same profile your resume agent uses. No separate questionnaire.",
	},
	{
		title: "Run Find jobs for me",
		body: "We filter the corpus, rank roles, and score the shortlist. Free takes a few minutes; Pro is longer. We email you when it is ready.",
	},
	{
		title: "Open a posting or Generate CV",
		body: "Readable matches show company, location, and ATS score. One click starts a tailored resume for that job.",
	},
] as const;

const plans = [
	{
		name: "Free",
		detail: "One promo search. Ten cards, five readable. The rest stay locked until you upgrade.",
	},
	{
		name: "Pro",
		detail: "First run plus daily new unique jobs. Up to 50 readable matches. Fresh roles marked for today.",
	},
] as const;

export default function JobRadarMarketingPage() {
	return (
		<div className="flex flex-1 flex-col bg-background">
			<SiteHeader />
			<main>
				<section>
					<div className="rail px-5 pt-12 pb-10 sm:px-8 md:px-10 md:pt-16 md:pb-14">
						<div className="flex size-14 items-center justify-center rounded-[22px] bg-pastel-blush text-brand">
							<SatelliteDish size={28} aria-hidden />
						</div>
						<h1 className="font-display mt-6 max-w-[16ch] text-[40px] leading-12 font-semibold tracking-[-0.8px] text-foreground sm:text-[52px] sm:leading-14 sm:tracking-[-1.04px]">
							Job Radar
						</h1>
						<p className="mt-5 max-w-[42ch] text-base leading-7 text-muted-foreground sm:text-[17px]">
							Hundreds of thousands of live Greenhouse, Lever,
							Ashby, and other ATS postings. We match them to your
							profile and score them the same way we score a
							tailored CV.
						</p>
						<div className="mt-8 flex flex-wrap gap-3">
							<SlideButton href={authPageHref("/sign-up")}>
								Start free
							</SlideButton>
							<SlideButton href="/sign-in" variant="outline">
								Log in to open Radar
							</SlideButton>
						</div>
						<p className="mt-4 text-sm text-muted-foreground">
							Have an account?{" "}
							<Link
								href="/sign-in"
								className="font-medium text-brand underline-offset-4 hover:underline"
							>
								Log in
							</Link>{" "}
							and open Job Radar from the sidebar.
						</p>
					</div>
				</section>

				<section>
					<div className="rail px-5 pb-16 sm:px-8 md:px-10 md:pb-20">
						<p className="eyebrow !text-brand">How it works</p>
						<div className="mt-8 grid gap-8 md:grid-cols-3">
							{steps.map((step, index) => (
								<div key={step.title}>
									<p className="text-sm font-medium text-brand">
										0{index + 1}
									</p>
									<h2 className="mt-2 text-[18px] font-semibold tracking-[-0.2px] text-foreground">
										{step.title}
									</h2>
									<p className="mt-2 text-[15px] leading-6 text-muted-foreground">
										{step.body}
									</p>
								</div>
							))}
						</div>
					</div>
				</section>

				<section>
					<div className="rail px-5 pb-20 sm:px-8 md:px-10 md:pb-28">
						<div className="rounded-[32px] bg-pastel-blush px-6 py-10 sm:px-10 sm:py-12">
							<p className="eyebrow !text-brand">Plans</p>
							<h2 className="font-display mt-3 max-w-[18ch] text-[28px] leading-9 font-semibold tracking-[-0.5px] text-foreground sm:text-[34px] sm:leading-10">
								One free search. Daily matches on Pro.
							</h2>
							<div className="mt-8 grid gap-6 sm:grid-cols-2">
								{plans.map((plan) => (
									<div key={plan.name}>
										<p className="text-[17px] font-semibold text-foreground">
											{plan.name}
										</p>
										<p className="mt-2 text-[15px] leading-6 text-muted-foreground">
											{plan.detail}
										</p>
									</div>
								))}
							</div>
							<div className="mt-8">
								<SlideButton href="/#pricing">
									See pricing
								</SlideButton>
							</div>
						</div>
					</div>
				</section>

				<ClosingCta />
			</main>
			<SiteFooter />
		</div>
	);
}
