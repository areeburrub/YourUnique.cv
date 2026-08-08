import { Show, UserButton } from "@clerk/nextjs";

import { BrandLogo } from "@/components/landing/brand-logo";
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
			<div className="rail flex h-14 items-center justify-between px-4 sm:px-8 md:px-10">
				<BrandLogo />
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
				<div className="flex items-center gap-2">
					<ModeToggle />
					<Show when="signed-out">
						<SlideButton
							href="/sign-in"
							variant="outline"
							className="hidden px-4 py-1 text-[14px] leading-5 sm:inline-flex"
						>
							Log in
						</SlideButton>
						<SlideButton
							href="/sign-up"
							className="px-4 py-1 text-[14px] leading-5"
						>
							Sign up
						</SlideButton>
					</Show>
					<Show when="signed-in">
						<SlideButton
							href="/new-chat"
							variant="outline"
							className="hidden px-4 py-1 text-[14px] leading-5 sm:inline-flex"
						>
							Open app
						</SlideButton>
						<UserButton
							appearance={{
								elements: {
									avatarBox: "size-8",
								},
							}}
						/>
					</Show>
				</div>
			</div>
		</header>
	);
}
