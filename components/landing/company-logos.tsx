const companies = [
	{ name: "Google", src: "/assets/companies/google.svg" },
	{ name: "Meta", src: "/assets/companies/meta.svg" },
	{ name: "Amazon", src: "/assets/companies/amazon.svg" },
	{ name: "Microsoft", src: "/assets/companies/microsoft.svg" },
	{ name: "Apple", src: "/assets/companies/apple.svg" },
	{ name: "Netflix", src: "/assets/companies/netflix.svg" },
	{ name: "Uber", src: "/assets/companies/uber.svg" },
	{ name: "Airbnb", src: "/assets/companies/airbnb.svg" },
	{ name: "Tesla", src: "/assets/companies/tesla.svg" },
	{ name: "NVIDIA", src: "/assets/companies/nvidia.svg" },
	{ name: "Stripe", src: "/assets/companies/stripe.svg" },
	{ name: "OpenAI", src: "/assets/companies/openai.svg" },
	{ name: "Spotify", src: "/assets/companies/spotify.svg" },
	{ name: "LinkedIn", src: "/assets/companies/linkedin.svg" },
] as const;

function LogoTrack({
	ariaHidden,
}: {
	ariaHidden?: boolean;
}) {
	return (
		<div
			aria-hidden={ariaHidden}
			className="flex items-center gap-12 pr-12"
		>
			{companies.map((company) => (
				<img
					key={company.name}
					src={company.src}
					alt={ariaHidden ? "" : company.name}
					className="h-7 w-auto max-w-30 object-contain opacity-60 grayscale dark:invert"
					loading="lazy"
					decoding="async"
				/>
			))}
		</div>
	);
}

export function CompanyLogos() {
	return (
		<section aria-label="Resumes created for roles at">
			<div className="rail overflow-hidden px-5 py-8 sm:px-8 md:px-10">
				<p className="eyebrow mb-4 text-center">Resumes created for roles at</p>
				<div className="relative overflow-hidden rounded-full bg-card px-4 py-5">
					<div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-card to-transparent" />
					<div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-card to-transparent" />
					<div className="animate-marquee flex w-max">
						<LogoTrack />
						<LogoTrack ariaHidden />
					</div>
				</div>
			</div>
		</section>
	);
}
