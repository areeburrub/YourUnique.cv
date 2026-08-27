import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";

export function ToolsChrome({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex flex-1 flex-col bg-background">
			<SiteHeader />
			<main>{children}</main>
			<SiteFooter />
		</div>
	);
}
