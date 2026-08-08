import Link from "next/link";

import { BrandLogo } from "@/components/landing/brand-logo";

const columns = [
	{
		title: "Product",
		links: [
			{ href: "#features", label: "Features" },
			{ href: "#persona", label: "Persona" },
			{ href: "#pricing", label: "Pricing" },
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
			{ href: "mailto:hello@yourunique.cv", label: "Contact" },
		],
	},
];

export function SiteFooter() {
	return (
		<footer className="border-t border-border">
			<div className="rail px-4 py-16 sm:px-8 md:px-10">
				<div className="grid gap-12 md:grid-cols-[1.2fr_1fr]">
					<div className="max-w-sm">
						<BrandLogo />
						<p className="mt-3 text-base leading-6 text-muted-foreground">
							A career persona and an agent that write the resume
							for the job you’re actually applying to.
						</p>
					</div>
					<div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
						{columns.map((column) => (
							<div key={column.title}>
								<p className="text-[13px] font-medium tracking-[-0.14px] text-foreground uppercase">
									{column.title}
								</p>
								<ul className="mt-4 space-y-3">
									{column.links.map((link) => (
										<li key={link.href}>
											<Link
												href={link.href}
												className="text-base text-muted-foreground transition-colors duration-300 hover:text-foreground"
											>
												{link.label}
											</Link>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>
			</div>
			<div className="border-t border-border">
				<div className="rail px-4 py-5 sm:px-8 md:px-10">
					<p className="text-base text-muted-foreground">
						© {new Date().getFullYear()} YourUnique.cv
					</p>
				</div>
			</div>
		</footer>
	);
}
