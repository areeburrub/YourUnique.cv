import { SlideButton } from "@/components/landing/slide-button";
import { TRIAL_DAYS } from "@/lib/plan-copy";

export function ClosingCta() {
	return (
		<section>
			<div className="rail px-5 pb-20 sm:px-8 md:px-10 md:pb-28">
				<div className="flex flex-col items-center rounded-[36px] bg-pastel-blush px-6 py-14 text-center sm:px-10 sm:py-16 md:py-20">
					<h2 className="font-display text-[40px] leading-[48px] font-semibold tracking-[-0.8px] text-foreground sm:whitespace-nowrap sm:text-[48px] sm:leading-[56px] sm:tracking-[-0.96px]">
						Start with the resume you already have
					</h2>
					<p className="mt-5 max-w-[36ch] text-base leading-7 text-muted-foreground">
						Try it for {TRIAL_DAYS} days. Paste the next job in
						chat and leave with a CV for that role.
					</p>
					<div className="mt-8 flex flex-wrap justify-center gap-3">
						<SlideButton href="/sign-up">
							{`Start ${TRIAL_DAYS}-day trial`}
						</SlideButton>
						<SlideButton href="/sign-in" variant="outline">
							Log in
						</SlideButton>
					</div>
				</div>
			</div>
		</section>
	);
}
