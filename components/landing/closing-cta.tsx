import { SlideButton } from "@/components/landing/slide-button";
import { PRO_PRICE_USD } from "@/lib/plans";

export function ClosingCta() {
	return (
		<section>
			<div className="rail px-5 pb-20 sm:px-8 md:px-10 md:pb-28">
				<div className="flex flex-col items-center rounded-[36px] bg-pastel-blush px-6 py-14 text-center sm:px-10 sm:py-16 md:py-20">
					<h2 className="font-display max-w-[18ch] text-[32px] leading-10 font-semibold tracking-[-0.64px] text-balance text-foreground sm:text-[40px] sm:leading-[48px] sm:tracking-[-0.8px] md:text-[48px] md:leading-[56px] md:tracking-[-0.96px]">
						Start with the resume you already have
					</h2>
					<p className="mt-5 max-w-[36ch] text-base leading-7 text-pretty text-muted-foreground">
						Free to start. Paste the next job in chat and leave with
						a CV for that role. Pro is ${PRO_PRICE_USD} a month for a higher
						limit.
					</p>
					<div className="mt-8 flex flex-wrap justify-center gap-3">
						<SlideButton href="/sign-up">Start free</SlideButton>
						<SlideButton href="/sign-in" variant="outline">
							Log in
						</SlideButton>
					</div>
				</div>
			</div>
		</section>
	);
}
