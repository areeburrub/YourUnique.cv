import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";

type LegalPageProps = {
	eyebrow: string;
	title: string;
	updated: string;
	children: React.ReactNode;
};

export function LegalPage({
	eyebrow,
	title,
	updated,
	children,
}: LegalPageProps) {
	return (
		<div className="flex flex-1 flex-col bg-background">
			<SiteHeader />
			<main>
				<section>
					<div className="rail px-5 pt-12 pb-20 sm:px-8 md:px-10 md:pt-16 md:pb-28">
						<p className="eyebrow text-brand!">{eyebrow}</p>
						<h1 className="font-display mt-4 max-w-[640px] text-[40px] leading-12 font-semibold tracking-[-0.8px] text-foreground sm:text-[48px] sm:leading-14 sm:tracking-[-0.96px]">
							{title}
						</h1>
						<p className="mt-4 text-sm text-muted-foreground">
							Last updated {updated}
						</p>
						<div className="mt-10 max-w-[680px] space-y-8 text-base leading-7 text-muted-foreground [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-[-0.3px] [&_h2]:text-foreground [&_p+h2]:mt-0 [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
							{children}
						</div>
					</div>
				</section>
			</main>
			<SiteFooter />
		</div>
	);
}
