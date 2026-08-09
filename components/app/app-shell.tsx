"use client";

import { AppSidebar } from "@/components/app/app-sidebar";
import {
	SidebarUserMenu,
	type SidebarUser,
} from "@/components/app/sidebar-user-menu";
import { SoftNavProvider, useSoftNav } from "@/components/app/soft-nav";
import { QueryProvider } from "@/components/providers/query-provider";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ChatThreadListItem } from "@/lib/chats";

type AppShellProps = {
	user: SidebarUser;
	recentThreads: ChatThreadListItem[];
	recentHasMore?: boolean;
	showUpgrade?: boolean;
	upgradeHref?: string;
	children: React.ReactNode;
};

function MobileBrand() {
	const { openNewChat } = useSoftNav();

	return (
		<button
			type="button"
			onClick={openNewChat}
			className="truncate font-display text-[18px] font-semibold tracking-[-0.4px] text-foreground"
		>
			YourUnique.cv
		</button>
	);
}

export function AppShell({
	user,
	recentThreads,
	recentHasMore = false,
	showUpgrade = false,
	upgradeHref = "/settings",
	children,
}: AppShellProps) {
	return (
		<QueryProvider>
			<SoftNavProvider>
				<TooltipProvider>
					<SidebarProvider className="h-svh overflow-hidden">
						<AppSidebar
							user={user}
							initialThreads={recentThreads}
							initialHasMore={recentHasMore}
							showUpgrade={showUpgrade}
							upgradeHref={upgradeHref}
						/>
						<SidebarInset className="min-h-0 overflow-hidden">
							<div className="flex h-14 shrink-0 items-center border-b border-border px-3 md:hidden">
								<div className="flex w-10 shrink-0 items-center justify-start">
									<SidebarTrigger className="text-muted-foreground" />
								</div>
								<div className="flex min-w-0 flex-1 items-center justify-center">
									<MobileBrand />
								</div>
								<div className="flex w-10 shrink-0 items-center justify-end">
									<SidebarUserMenu user={user} compact />
								</div>
							</div>
							<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
								{children}
							</div>
						</SidebarInset>
					</SidebarProvider>
				</TooltipProvider>
			</SoftNavProvider>
		</QueryProvider>
	);
}
