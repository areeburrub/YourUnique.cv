"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { useEffect } from "react";

import { AppSidebar } from "@/components/app/app-sidebar";
import { CommandPaletteProvider } from "@/components/app/command-palette";
import { type SidebarUser } from "@/components/app/sidebar-user-menu";
import { SoftNavProvider, useSoftNav } from "@/components/app/soft-nav";
import { QueryProvider } from "@/components/providers/query-provider";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useVisualViewportHeight } from "@/hooks/use-visual-viewport-height";
import type { ChatThreadListItem } from "@/lib/chats";
import { discardPendingResume } from "@/lib/onboarding/client";

type AppShellProps = {
	user: SidebarUser;
	recentThreads: ChatThreadListItem[];
	recentHasMore?: boolean;
	showUpgrade?: boolean;
	upgradeHref?: string;
	upgradeLabel?: string;
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

function MobileNewChatButton() {
	const { openNewChat } = useSoftNav();

	return (
		<Button
			variant="ghost"
			size="icon-sm"
			className="text-muted-foreground"
			aria-label="New chat"
			onClick={openNewChat}
		>
			<PlusIcon size={18} weight="bold" />
		</Button>
	);
}

export function AppShell({
	user,
	recentThreads,
	recentHasMore = false,
	showUpgrade = false,
	upgradeHref = "/settings",
	upgradeLabel,
	children,
}: AppShellProps) {
	useVisualViewportHeight();

	useEffect(() => {
		void discardPendingResume();
	}, []);

	return (
		<QueryProvider>
			<SoftNavProvider>
				<TooltipProvider>
					<SidebarProvider className="h-[var(--app-height,100dvh)] min-h-0 overflow-hidden">
						<CommandPaletteProvider
							showUpgrade={showUpgrade}
							upgradeHref={upgradeHref}
							upgradeLabel={upgradeLabel}
						>
							<AppSidebar
								user={user}
								initialThreads={recentThreads}
								initialHasMore={recentHasMore}
								showUpgrade={showUpgrade}
								upgradeHref={upgradeHref}
								upgradeLabel={upgradeLabel}
							/>
							<SidebarInset className="min-h-0 overflow-hidden">
								<div className="flex h-16 shrink-0 items-center px-4 md:hidden">
									<div className="flex w-20 shrink-0 items-center justify-start">
										<SidebarTrigger className="text-muted-foreground" />
									</div>
									<div className="flex min-w-0 flex-1 items-center justify-center">
										<MobileBrand />
									</div>
									<div className="flex w-20 shrink-0 items-center justify-end">
										<MobileNewChatButton />
									</div>
								</div>
								<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
									{children}
								</div>
							</SidebarInset>
						</CommandPaletteProvider>
					</SidebarProvider>
				</TooltipProvider>
			</SoftNavProvider>
		</QueryProvider>
	);
}
