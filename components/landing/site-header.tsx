import { Show } from "@clerk/nextjs";

import { BrandLogo } from "@/components/landing/brand-logo";
import { HeaderUserMenu } from "@/components/landing/header-user-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { SlideButton } from "@/components/landing/slide-button";

const navLinks = [
	{ href: "#features", label: "Features" },
	{ href: "#persona", label: "Your persona" },
	{ href: "#pricing", label: "Pricing" },
];

export function SiteHeader() {
	return (
		<header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
			<div className="rail flex h-14 items-center justify-between gap-2 px-4 sm:gap-3 sm:px-8 md:px-10">
				<BrandLogo className="min-w-0 shrink" />
				<nav className="hidden items-center gap-8 md:flex">
					{navLinks.map((link) => (
						<a
							key={link.href}
							href={link.href}
							className="text-base text-muted-foreground transition-colors duration-300 hover:text-foreground"
						>
							{link.label}
						</a>
					))}
				</nav>
				<div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
					<Show when="signed-out">
						<ModeToggle />
						<SlideButton
							href="/sign-in"
							variant="outline"
							className="hidden px-4 py-1 text-[14px] leading-5 sm:inline-flex"
						>
							Log in
						</SlideButton>
						<SlideButton
							href="/sign-up"
							className="px-3 py-1 text-[13px] leading-5 sm:px-4 sm:text-[14px]"
						>
							Sign up
						</SlideButton>
					</Show>
					<Show when="signed-in">
						<SlideButton
							href="/new-chat"
							variant="outline"
							className="px-3 py-1 text-[13px] leading-5 sm:px-4 sm:text-[14px]"
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
