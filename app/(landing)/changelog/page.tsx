import type { Metadata } from "next";

import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import {
	CHANGELOG,
	formatChangelogDate,
	type ChangelogKind,
} from "@/lib/changelog";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
	title: "Changelog",
	description: `What shipped on ${SITE_NAME}, version by version.`,
	alternates: {
		canonical: "/changelog",
	},
	openGraph: {
		type: "website",
		title: `Changelog | ${SITE_NAME}`,
		description: `What shipped on ${SITE_NAME}, version by version.`,
		url: "/changelog",
	},
};

const KIND_LABEL: Record<ChangelogKind, string> = {
	new: "New",
	improved: "Improved",
	fixed: "Fixed",
};

export default function ChangelogPage() {
	return (
		<div className="flex flex-1 flex-col bg-background">
			<SiteHeader />
			<main>
				<section>
					<div className="rail px-5 pt-12 pb-8 sm:px-8 md:px-10 md:pt-16">
						<p className="eyebrow text-brand!">Changelog</p>
						<h1 className="font-display mt-4 max-w-[520px] text-[40px] leading-12 font-semibold tracking-[-0.8px] text-foreground sm:text-[48px] sm:leading-14 sm:tracking-[-0.96px]">
							What we shipped
						</h1>
						<p className="mt-5 max-w-[440px] text-base leading-7 text-muted-foreground">
							Product versions, newest first. Internal refactors
							stay off this list.
						</p>
					</div>
				</section>

				<section>
					<div className="rail px-5 pb-20 sm:px-8 md:px-10 md:pb-28">
						<ol className="max-w-[680px] space-y-14">
							{CHANGELOG.map((release) => (
								<li key={release.version}>
									<article>
										<header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
											<h2 className="font-display text-xl font-semibold tracking-[-0.3px] text-foreground">
												{release.version}
											</h2>
											<time
												dateTime={release.date}
												className="text-sm text-muted-foreground"
											>
												{formatChangelogDate(release.date)}
											</time>
										</header>
										<p className="mt-2 text-base font-medium text-foreground">
											{release.title}
										</p>
										<ul className="mt-4 space-y-3">
											{release.items.map((item) => (
												<li
													key={item.text}
													className="flex gap-3 text-base leading-7 text-muted-foreground"
												>
													<span className="mt-0.5 w-[5.5rem] shrink-0 text-[12px] font-medium tracking-[0.04em] text-foreground uppercase">
														{KIND_LABEL[item.kind]}
													</span>
													<span>{item.text}</span>
												</li>
											))}
										</ul>
									</article>
								</li>
							))}
						</ol>
					</div>
				</section>
			</main>
			<SiteFooter />
		</div>
	);
}
