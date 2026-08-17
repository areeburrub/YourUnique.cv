import { HeroResumeDropzone } from "@/components/landing/hero-resume-dropzone";
import { ProductPreview } from "@/components/landing/product-preview";
import { SITE_NAME } from "@/lib/site";

export function Hero() {
	return (
		<section className="overflow-x-clip">
			<div className="rail px-5 sm:px-8 md:px-10">
				<div className="grid min-w-0 items-center gap-10 py-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-14 lg:py-20">
					<div className="flex min-w-0 flex-col justify-center">
						<p className="eyebrow animate-fade-rise !text-brand normal-case">
							{SITE_NAME}
						</p>
						<h1 className="font-display animate-fade-rise delay-1 mt-4 max-w-[480px] text-[36px] leading-[42px] font-semibold tracking-[-1px] text-foreground sm:mt-5 sm:text-[48px] sm:leading-[54px] sm:tracking-[-1.2px] md:text-[56px] md:leading-[64px] md:tracking-[-1.68px]">
							Every job is different. Why send the same CV?
						</h1>
						<p className="animate-fade-rise delay-2 mt-5 max-w-[400px] text-[16px] leading-7 text-muted-foreground sm:text-[17px]">
							Start from your resume and LinkedIn. Share a job
							post in chat and get a CV written for that role,
							plus an ATS read.
						</p>
						<div className="animate-fade-rise delay-3 mt-8">
							<HeroResumeDropzone />
						</div>
					</div>

					<div className="animate-fade-rise delay-4 min-h-0 min-w-0">
						<ProductPreview />
					</div>
				</div>
			</div>
		</section>
	);
}
