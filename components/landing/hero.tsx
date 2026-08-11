import { ProductPreview } from "@/components/landing/product-preview";
import { SlideButton } from "@/components/landing/slide-button";

const avatars = [
	{ initials: "MR", tone: "bg-[#dbe7ff] text-brand" },
	{ initials: "JK", tone: "bg-[#e8f1ff] text-[#0050e2]" },
	{ initials: "SL", tone: "bg-[#ffe8cc] text-[#c56a12]" },
];

export function Hero() {
	return (
		<section className="overflow-x-clip border-b border-border">
			<div className="rail">
				<div className="grid min-w-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
					<div className="flex min-w-0 flex-col border-b border-border lg:border-r lg:border-b-0">
						<div className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-8 sm:py-16 md:px-10 lg:py-[72px]">
							<p className="eyebrow animate-fade-rise !text-brand">
								YourUnique.cv
							</p>
							<h1 className="font-display animate-fade-rise delay-1 mt-3 max-w-[421px] text-[32px] leading-[38px] font-semibold tracking-[-0.96px] text-foreground sm:mt-3.5 sm:text-[40px] sm:leading-[48px] sm:tracking-[-1.2px] md:text-[56px] md:leading-[64px] md:tracking-[-1.68px]">
								Every job is different so why same CV
							</h1>
							<p className="animate-fade-rise delay-2 mt-4 max-w-[350px] text-[15px] leading-6 text-muted-foreground sm:mt-5 sm:text-base">
								You have more sides than one CV can hold. Chat with
								an agent that knows your journey and writes the
								version that fits this role.
							</p>
							<div className="animate-fade-rise delay-3 mt-6 flex flex-wrap gap-2.5 sm:mt-7">
								<SlideButton href="/sign-up">Get Started</SlideButton>
								<SlideButton href="#features" variant="outline">
									See features
								</SlideButton>
							</div>
							<div className="animate-fade-rise delay-4 mt-6 flex flex-wrap items-center gap-3 sm:mt-7">
								<div className="flex items-center">
									{avatars.map((avatar, index) => (
										<span
											key={avatar.initials}
											className={`flex size-8 items-center justify-center rounded-full border-2 border-background text-[11px] font-semibold ${avatar.tone} ${index > 0 ? "-ml-2" : ""}`}
										>
											{avatar.initials}
										</span>
									))}
								</div>
								<p className="text-[14px] leading-5 text-muted-foreground">
									<span className="font-medium text-foreground">4.9/5</span>
									{" "}
									from early applicants
								</p>
							</div>
						</div>

						<div className="hidden h-12 border-t border-border lg:block" />
					</div>

					<div className="animate-fade-rise delay-5 min-h-0 min-w-0 lg:min-h-full">
						<ProductPreview />
					</div>
				</div>
			</div>
		</section>
	);
}
