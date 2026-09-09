import type { Metadata } from "next";

import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { SlideButton } from "@/components/landing/slide-button";

export const metadata: Metadata = {
	title: "Page not found",
};

export default function NotFound() {
	return (
		<div className="flex flex-1 flex-col bg-background">
			<SiteHeader />
			<main className="flex flex-1 flex-col">
				<section className="flex flex-1 flex-col">
					<div className="rail flex flex-1 flex-col items-center justify-center px-5 py-20 text-center sm:px-8 md:px-10 md:py-28">
						<p className="eyebrow text-brand!">404</p>
						<h1 className="font-display mt-4 max-w-[16ch] text-[40px] leading-12 font-semibold tracking-[-0.8px] text-balance text-foreground sm:text-[48px] sm:leading-14 sm:tracking-[-0.96px]">
							This page didn&apos;t make the cut
						</h1>
						<p className="mt-5 max-w-[40ch] text-base leading-7 text-pretty text-muted-foreground">
							The URL isn&apos;t here. It may have moved, or it
							never existed.
						</p>
						<div className="mt-8 flex flex-wrap justify-center gap-3">
							<SlideButton href="/">Go home</SlideButton>
							<SlideButton href="/free-tools" variant="outline">
								Free tools
							</SlideButton>
						</div>
					</div>
				</section>
			</main>
			<SiteFooter />
		</div>
	);
}
