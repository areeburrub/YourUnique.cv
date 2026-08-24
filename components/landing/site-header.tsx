import Link from "next/link";

import { BrandLogo } from "@/components/landing/brand-logo";
import { SiteHeaderAuth } from "@/components/landing/site-header-auth";
import { ModeToggle } from "@/components/mode-toggle";

const navLinks = [
	{ href: "/#how-it-works", label: "How it works" },
	{ href: "/#pricing", label: "Pricing" },
];

export function SiteHeader() {
	return (
		<header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md">
			<div className="rail flex h-16 items-center justify-between gap-3 px-5 sm:px-8 md:h-[4.5rem] md:px-10">
				<BrandLogo className="min-w-0 shrink" />
				<div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
					<nav className="mr-1 hidden items-center gap-6 md:flex">
						{navLinks.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className="text-[15px] font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
							>
								{link.label}
							</Link>
						))}
					</nav>
					<ModeToggle />
					<SiteHeaderAuth />
				</div>
			</div>
		</header>
	);
}
