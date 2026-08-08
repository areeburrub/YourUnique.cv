"use client";

import Link from "next/link";

import { AppSidebar } from "@/components/app/app-sidebar";
import {
	SidebarUserMenu,
	type SidebarUser,
} from "@/components/app/sidebar-user-menu";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ChatThreadListItem } from "@/lib/chats";

type AppShellProps = {
	user: SidebarUser;
	recentThreads: ChatThreadListItem[];
	children: React.ReactNode;
};

export function AppShell({ user, recentThreads, children }: AppShellProps) {
	return (
		<TooltipProvider>
			<SidebarProvider className="h-svh overflow-hidden">
				<AppSidebar user={user} recentThreads={recentThreads} />
				<SidebarInset className="min-h-0 overflow-hidden">
					<div className="flex h-14 shrink-0 items-center border-b border-border px-3 md:hidden">
						<div className="flex w-10 shrink-0 items-center justify-start">
							<SidebarTrigger className="text-muted-foreground" />
						</div>
						<div className="flex min-w-0 flex-1 items-center justify-center">
							<Link
								href="/new-chat"
								className="truncate font-display text-[18px] font-semibold tracking-[-0.4px] text-foreground"
							>
								YourUnique.cv
							</Link>
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
	);
}
