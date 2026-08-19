import {
	DeviceMobileIcon,
	LinkSimpleIcon,
	SwatchesIcon,
} from "@phosphor-icons/react/ssr";

const features = [
	{
		title: "Keep your own template",
		body: "No generic designs. New drafts stay in your layout.",
		icon: SwatchesIcon,
	},
	{
		title: "Paste any job link",
		body: "LinkedIn, Workday, or a careers page. Get a resume for that role.",
		icon: LinkSimpleIcon,
	},
	{
		title: "Works from your phone",
		body: "No editor, no manual formatting. Send the job, get the PDF.",
		icon: DeviceMobileIcon,
	},
] as const;

export function UniqueFeatures() {
	return (
		<section aria-label="Unique features">
			<div className="rail px-5 py-16 sm:px-8 sm:py-20 md:px-10">
				<div className="text-center">
					<p className="eyebrow !text-brand">Why it's different</p>
					<h2 className="font-display mt-3 text-[28px] leading-9 font-semibold tracking-[-0.5px] text-foreground sm:text-[34px] sm:leading-10">
						Built to skip the busywork
					</h2>
				</div>

				<div className="mt-10 grid gap-4 sm:grid-cols-3">
					{features.map((feature) => {
						const Icon = feature.icon;
						return (
							<div
								key={feature.title}
								className="rounded-[24px] border border-border bg-card px-5 py-6 shadow-xs"
							>
								<span className="flex size-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
									<Icon size={21} weight="bold" />
								</span>
								<p className="mt-4 text-[17px] font-semibold tracking-[-0.2px] text-foreground">
									{feature.title}
								</p>
								<p className="mt-1.5 text-[14px] leading-5.5 text-muted-foreground">
									{feature.body}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
