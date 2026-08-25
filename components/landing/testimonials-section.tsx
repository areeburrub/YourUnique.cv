import { LinkedinLogoIcon, QuotesIcon } from "@phosphor-icons/react/ssr";

const TESTIMONIAL = {
	quote:
		"This is actually a useful build, not just another resume tool. The JD-based tailoring + ATS gap analysis makes a lot of sense. Curious to see how you keep improving it.",
	name: "Sandip Jaiswar",
	role: "Career Strategist",
	href: "https://www.linkedin.com/in/sandip-jaiswar-95995891/",
	photo: "/assets/testimonials/sandip-jaiswar.jpg",
} as const;

export function TestimonialsSection() {
	return (
		<section id="testimonials" aria-labelledby="testimonial-heading">
			<div className="rail px-5 py-16 sm:px-8 sm:py-20 md:px-10 md:py-28">
				<div className="mx-auto max-w-[720px] text-center">
					<p className="eyebrow !text-brand">From people using it</p>
					<h2
						id="testimonial-heading"
						className="font-display mt-3 text-[28px] leading-9 font-semibold tracking-[-0.5px] text-foreground sm:text-[34px] sm:leading-10"
					>
						Not just another resume tool
					</h2>
				</div>

				<figure className="mx-auto mt-10 max-w-[720px]">
					<div className="relative overflow-hidden rounded-[32px] bg-pastel-sage px-6 py-8 sm:rounded-[36px] sm:px-10 sm:py-10 md:px-12 md:py-12">
						<QuotesIcon
							aria-hidden
							size={40}
							weight="fill"
							className="text-brand"
						/>
						<blockquote className="mt-5">
							<p className="font-display text-[20px] leading-8 font-medium tracking-[-0.3px] text-pretty text-foreground sm:text-[24px] sm:leading-9 sm:tracking-[-0.4px]">
								{TESTIMONIAL.quote}
							</p>
						</blockquote>
						<figcaption className="mt-8 flex items-center gap-3 border-t border-foreground/8 pt-6">
							<img
								src={TESTIMONIAL.photo}
								alt=""
								width={56}
								height={56}
								className="size-14 shrink-0 rounded-full object-cover ring-2 ring-card"
								loading="lazy"
								decoding="async"
							/>
							<div className="min-w-0 text-left">
								<a
									href={TESTIMONIAL.href}
									target="_blank"
									rel="noopener noreferrer"
									className="group inline-flex items-center gap-1.5 text-[15px] font-semibold tracking-[-0.2px] text-foreground"
									aria-label={`${TESTIMONIAL.name} on LinkedIn`}
								>
									{TESTIMONIAL.name}
									<LinkedinLogoIcon
										size={13}
										weight="regular"
										className="text-muted-soft transition-colors duration-200 group-hover:text-foreground"
									/>
								</a>
								<p className="text-[13px] text-muted-foreground">
									{TESTIMONIAL.role}
								</p>
							</div>
						</figcaption>
					</div>
				</figure>
			</div>
		</section>
	);
}
