import { SlideButton } from "@/components/landing/slide-button";
import { TRIAL_DAYS } from "@/lib/plan-copy";

export function ArticleSidebarCta() {
	return (
		<aside className="rounded-[24px] bg-pastel-blush px-4 py-5">
			<p className="text-[13px] font-medium tracking-[0.06em] text-brand uppercase">
				Free trial
			</p>
			<p className="font-display mt-2 text-[18px] leading-6 font-semibold tracking-[-0.3px] text-foreground">
				Try it for {TRIAL_DAYS} days
			</p>
			<p className="mt-2 text-[14px] leading-5 text-pretty text-muted-foreground">
				No card. Paste a job and get a CV written for that role.
			</p>
			<SlideButton
				href="/sign-up"
				className="mt-4 h-11 w-full px-4 text-[15px]"
			>
				{`Start ${TRIAL_DAYS}-day trial`}
			</SlideButton>
		</aside>
	);
}
