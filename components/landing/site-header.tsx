import { Show } from "@clerk/nextjs";
import Link from "next/link";

import { BrandLogo } from "@/components/landing/brand-logo";
import { HeaderUserMenu } from "@/components/landing/header-user-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { SlideButton } from "@/components/landing/slide-button";

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
					<Show when="signed-out">
						<SlideButton
							href="/sign-in"
							variant="outline"
							className="hidden h-11 px-5 text-[15px] sm:inline-flex"
						>
							Log in
						</SlideButton>
						<SlideButton
							href="/sign-up"
							className="h-11 px-5 text-[15px] sm:px-6"
						>
							Sign up
						</SlideButton>
					</Show>
					<Show when="signed-in">
						<SlideButton
							href="/new-chat"
							variant="outline"
							className="h-11 px-5 text-[15px] sm:px-6"
						>
							Open app
						</SlideButton>
						<HeaderUserMenu />
					</Show>
				</div>
			</div>
		</header>
	);
}
