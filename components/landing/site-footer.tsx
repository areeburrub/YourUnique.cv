import Link from "next/link";

import { BrandLogo } from "@/components/landing/brand-logo";
import { SITE_EMAIL } from "@/lib/site";

const columns = [
	{
		title: "Product",
		links: [
			{ href: "/#how-it-works", label: "How it works" },
			{ href: "/templates", label: "Templates" },
			{ href: "/#pricing", label: "Pricing" },
		],
	},
	{
		title: "Account",
		links: [
			{ href: "/sign-in", label: "Log in" },
			{ href: "/sign-up", label: "Sign up" },
		],
	},
	{
		title: "Company",
		links: [
			{ href: `mailto:${SITE_EMAIL}`, label: "Contact" },
		],
	},
];

export function SiteFooter() {
	return (
		<footer>
			<div className="rail px-5 py-16 sm:px-8 md:px-10">
				<div className="grid gap-12 rounded-[32px] bg-card px-6 py-10 sm:px-8 md:grid-cols-[1.2fr_1fr] md:px-10">
					<div className="max-w-sm">
						<BrandLogo />
						<p className="mt-4 text-base leading-7 text-muted-foreground">
							A career persona and an agent that write the resume
							for the job you’re actually applying to.
						</p>
					</div>
					<div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
						{columns.map((column) => (
							<div key={column.title}>
								<p className="text-[13px] font-medium tracking-[0.06em] text-foreground uppercase">
									{column.title}
								</p>
								<ul className="mt-4 space-y-3">
									{column.links.map((link) => {
										const className =
											"text-base text-muted-foreground transition-colors duration-200 hover:text-foreground";

										return (
											<li key={link.href}>
												{link.href.startsWith("#") ? (
													<a href={link.href} className={className}>
														{link.label}
													</a>
												) : (
													<Link href={link.href} className={className}>
														{link.label}
													</Link>
												)}
											</li>
										);
									})}
								</ul>
							</div>
						))}
					</div>
				</div>
			</div>
			<div className="rail flex flex-col gap-2 px-5 pb-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 md:px-10">
				<p className="text-[15px] text-muted-foreground">
					© {new Date().getFullYear()} YourUnique.cv
				</p>
				<p className="text-[15px] text-muted-foreground">
					Built with ❤️ by{" "}
					<Link
						href="https://areeburrub.dev"
						target="_blank"
						rel="noreferrer"
						className="font-medium text-foreground transition-colors duration-200 hover:text-brand"
					>
						Areeb ur Rub
					</Link>
					{" · "}
					<Link
						href="https://github.com/areeburrub/YourUnique.cv"
						target="_blank"
						rel="noreferrer"
						className="font-medium text-foreground transition-colors duration-200 hover:text-brand"
					>
						Open source
					</Link>
				</p>
			</div>
		</footer>
	);
}
