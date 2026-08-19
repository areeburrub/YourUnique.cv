import {
	ChatCircleIcon,
	FilePdfIcon,
	UploadSimpleIcon,
} from "@phosphor-icons/react/ssr";

import { SlideButton } from "@/components/landing/slide-button";

const nextSteps = [
	{
		title: "Upload a CV or LinkedIn",
		body: "We pull roles, skills, and wins into one profile.",
		Icon: UploadSimpleIcon,
	},
	{
		title: "Paste the job when you apply",
		body: "Chat a draft written for that posting, not a generic file.",
		Icon: ChatCircleIcon,
	},
	{
		title: "Export the PDF",
		body: "Keep a version for this role, plus an ATS read.",
		Icon: FilePdfIcon,
	},
] as const;

export function ClosingCta() {
	return (
		<section>
			<div className="rail px-5 pb-20 sm:px-8 md:px-10 md:pb-28">
				<div className="grid overflow-hidden rounded-[36px] bg-pastel-blush lg:grid-cols-[1.1fr_0.9fr]">
					<div className="flex flex-col justify-center px-6 py-12 sm:px-10 sm:py-16 md:px-12 md:py-20">
						<p className="eyebrow !text-brand">Your next application</p>
						<h2 className="font-display mt-4 max-w-[440px] text-[40px] leading-[48px] font-semibold tracking-[-0.8px] text-foreground sm:text-[48px] sm:leading-[56px] sm:tracking-[-0.96px]">
							Start with the resume you already have
						</h2>
						<p className="mt-5 max-w-[400px] text-base leading-7 text-muted-foreground">
							Try it for 7 days. Add your history once. The next
							time a posting shows up, paste it in chat and leave
							with a CV for that job.
						</p>
						<div className="mt-8 flex flex-wrap gap-3">
							<SlideButton href="/sign-up">
								Start 7-day trial
							</SlideButton>
							<SlideButton href="/sign-in" variant="outline">
								Log in
							</SlideButton>
						</div>
					</div>

					<div className="flex items-center px-6 pb-10 sm:px-10 lg:py-16 lg:pr-12">
						<ol className="w-full rounded-[28px] bg-card px-5 py-6 sm:px-7 sm:py-8">
							{nextSteps.map(({ title, body, Icon }, index) => (
								<li
									key={title}
									className="flex gap-4 border-border py-4 first:pt-0 last:pb-0 not-first:border-t"
								>
									<span className="flex size-12 shrink-0 items-center justify-center rounded-[16px] bg-pastel-blush text-brand">
										<Icon size={22} weight="bold" />
									</span>
									<div className="min-w-0">
										<p className="text-[15px] font-medium tracking-[-0.1px] text-foreground">
											<span className="mr-1.5 text-muted-soft">
												{String(index + 1).padStart(2, "0")}
											</span>
											{title}
										</p>
										<p className="mt-1 text-[14px] leading-6 text-muted-foreground">
											{body}
										</p>
									</div>
								</li>
							))}
						</ol>
					</div>
				</div>
			</div>
		</section>
	);
}
