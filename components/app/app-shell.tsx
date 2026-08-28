"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { useEffect } from "react";

import { AppSidebar } from "@/components/app/app-sidebar";
import { CommandPaletteProvider } from "@/components/app/command-palette";
import { HasReadyResumeProvider } from "@/components/app/has-ready-resume";
import {
	MobileUserSidebarTrigger,
	SidebarUserMenu,
	type SidebarUser,
} from "@/components/app/sidebar-user-menu";
import { SoftNavProvider, useSoftNav } from "@/components/app/soft-nav";
import { LogoMark } from "@/components/brand/logo-mark";
import { QueryProvider } from "@/components/providers/query-provider";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
	hasReadyResume?: boolean;
	children: React.ReactNode;
};

function MobileBrand() {
	const { openNewChat } = useSoftNav();

	return (
		<button
			type="button"
			onClick={openNewChat}
			className="inline-flex min-w-0 max-w-full items-center gap-1.5 font-display text-[18px] font-semibold tracking-[-0.4px] text-foreground"
		>
			<LogoMark size={20} className="text-brand" />
			<span className="truncate">YourUnique.cv</span>
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
	hasReadyResume = false,
	children,
}: AppShellProps) {
	useVisualViewportHeight();

	useEffect(() => {
		void discardPendingResume();
	}, []);

	return (
		<QueryProvider>
			<HasReadyResumeProvider hasReadyResume={hasReadyResume}>
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
									showUpgrade={showUpgrade}
									upgradeHref={upgradeHref}
									initialThreads={recentThreads}
									initialHasMore={recentHasMore}
								/>
								<SidebarInset className="min-h-0 overflow-hidden">
									<header className="flex h-16 shrink-0 items-center gap-2 px-4 md:h-12 md:px-5">
										<div className="shrink-0 md:hidden">
											<MobileUserSidebarTrigger user={user} />
										</div>
										<div className="flex min-w-0 flex-1 items-center justify-center overflow-hidden md:hidden">
											<MobileBrand />
										</div>
										<div className="ml-auto flex shrink-0 items-center gap-1">
											<div className="md:hidden">
												<MobileNewChatButton />
											</div>
											<div className="hidden md:block">
												<SidebarUserMenu
													user={user}
													showUpgrade={showUpgrade}
													upgradeHref={upgradeHref}
												/>
											</div>
										</div>
									</header>
									<div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
										{children}
									</div>
								</SidebarInset>
							</CommandPaletteProvider>
						</SidebarProvider>
					</TooltipProvider>
				</SoftNavProvider>
			</HasReadyResumeProvider>
		</QueryProvider>
	);
}
