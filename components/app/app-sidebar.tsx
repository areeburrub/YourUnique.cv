"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	FileText,
	MessageSquare,
	Plus,
	Search,
	SlidersHorizontal,
	UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	SidebarTrigger,
	useSidebar,
} from "@/components/ui/sidebar";
import { SidebarUserMenu, type SidebarUser } from "@/components/app/sidebar-user-menu";
import {
	type ChatThreadListItem,
	getChatThreadHref,
} from "@/lib/chats";

const primaryNav = [
	{ title: "New chat", href: "/new-chat", icon: Plus, exact: true },
	{ title: "Chats", href: "/chats", icon: MessageSquare },
	{ title: "Profile", href: "/profile", icon: UserRound },
	{ title: "Resumes", href: "/resumes", icon: FileText },
] as const;

const GROUP_BY_KEY = "yourunique:recents-group-by";

type RecentsGroupBy = "none" | "date";

type ThreadDateGroup = {
	label: string;
	threads: ChatThreadListItem[];
};

function isActivePath(pathname: string, href: string, exact?: boolean) {
	if (exact) {
		return pathname === href;
	}
	return pathname === href || pathname.startsWith(`${href}/`);
}

function getDateGroupLabel(iso: string, now = new Date()) {
	const date = new Date(iso);
	const startOfToday = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
	);
	const startOfThatDay = new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
	);
	const dayDiff = Math.round(
		(startOfToday.getTime() - startOfThatDay.getTime()) / 86_400_000,
	);

	if (dayDiff === 0) {
		return "Today";
	}
	if (dayDiff === 1) {
		return "Yesterday";
	}
	if (dayDiff < 7) {
		return "Previous 7 Days";
	}
	if (dayDiff < 30) {
		return "Previous 30 Days";
	}
	return "Older";
}

function groupThreadsByDate(threads: ChatThreadListItem[]): ThreadDateGroup[] {
	const groups = new Map<string, ChatThreadListItem[]>();
	const order: string[] = [];

	for (const thread of threads) {
		const label = getDateGroupLabel(thread.updatedAt);
		const existing = groups.get(label);
		if (existing) {
			existing.push(thread);
			continue;
		}
		groups.set(label, [thread]);
		order.push(label);
	}

	return order.map((label) => ({
		label,
		threads: groups.get(label) ?? [],
	}));
}

function ThreadLink({
	thread,
	pathname,
}: {
	thread: ChatThreadListItem;
	pathname: string;
}) {
	const href = getChatThreadHref(thread.id);

	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				render={<Link href={href} />}
				isActive={pathname === href}
				tooltip={thread.title}
				className="text-muted-foreground"
			>
				<span className="truncate">{thread.title}</span>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
}

type AppSidebarProps = {
	user: SidebarUser;
	recentThreads: ChatThreadListItem[];
};

export function AppSidebar({ user, recentThreads }: AppSidebarProps) {
	const pathname = usePathname();
	const { state } = useSidebar();
	const collapsed = state === "collapsed";
	const [groupBy, setGroupBy] = useState<RecentsGroupBy>("none");

	useEffect(() => {
		const stored = window.localStorage.getItem(GROUP_BY_KEY);
		if (stored === "none" || stored === "date") {
			setGroupBy(stored);
		}
	}, []);

	const dateGroups =
		groupBy === "date" ? groupThreadsByDate(recentThreads) : [];

	const handleGroupByChange = (value: string) => {
		if (value !== "none" && value !== "date") {
			return;
		}
		setGroupBy(value);
		window.localStorage.setItem(GROUP_BY_KEY, value);
	};

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader className="h-14 p-0">
				{collapsed ? (
					<div className="flex size-full items-center justify-center p-2">
						<SidebarTrigger className="size-8 text-muted-foreground" />
					</div>
				) : (
					<div className="flex h-full w-full items-center gap-1 px-3">
						<Link
							href="/new-chat"
							className="flex min-w-0 flex-1 items-center overflow-hidden rounded-control px-1"
						>
							<span className="truncate font-display text-[18px] font-semibold tracking-[-0.4px] text-sidebar-foreground">
								YourUnique.cv
							</span>
						</Link>
						<Button
							variant="ghost"
							size="icon-sm"
							className="shrink-0 text-muted-foreground"
							aria-label="Search"
						>
							<Search className="size-4" />
						</Button>
						<SidebarTrigger className="shrink-0 text-muted-foreground" />
					</div>
				)}
			</SidebarHeader>

			<SidebarContent className="gap-1 pb-3">
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{primaryNav.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										render={<Link href={item.href} />}
										isActive={isActivePath(
											pathname,
											item.href,
											"exact" in item ? item.exact : false,
										)}
										tooltip={item.title}
									>
										{item.title === "New chat" ? (
											<span className="flex size-5 items-center justify-center rounded-full border border-sidebar-border group-data-[collapsible=icon]:size-4 group-data-[collapsible=icon]:border-0">
												<item.icon className="size-3.5 group-data-[collapsible=icon]:size-4" />
											</span>
										) : (
											<item.icon />
										)}
										<span>{item.title}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarGroup className="group-data-[collapsible=icon]:hidden">
					<div className="flex h-8 items-center justify-between px-2">
						<SidebarGroupLabel className="p-0 text-[12px] font-medium tracking-[-0.1px] text-muted-soft">
							Recents
						</SidebarGroupLabel>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button
										variant="ghost"
										size="icon-sm"
										className="size-6 text-muted-soft"
										aria-label="Group recents"
									/>
								}
							>
								<SlidersHorizontal className="size-3.5" />
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="min-w-36">
								<DropdownMenuGroup>
									<DropdownMenuLabel>Group by</DropdownMenuLabel>
									<DropdownMenuRadioGroup
										value={groupBy}
										onValueChange={handleGroupByChange}
									>
										<DropdownMenuRadioItem value="none">
											None
										</DropdownMenuRadioItem>
										<DropdownMenuRadioItem value="date">
											Date
										</DropdownMenuRadioItem>
									</DropdownMenuRadioGroup>
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					<SidebarGroupContent>
						{recentThreads.length === 0 ? (
							<p className="px-2 text-[12px] text-muted-soft">No chats yet</p>
						) : groupBy === "date" ? (
							<div className="flex flex-col gap-2">
								{dateGroups.map((group) => (
									<div key={group.label}>
										<p className="px-2 py-1 text-[11px] font-medium tracking-[-0.1px] text-muted-soft">
											{group.label}
										</p>
										<SidebarMenu>
											{group.threads.map((thread) => (
												<ThreadLink
													key={thread.id}
													thread={thread}
													pathname={pathname}
												/>
											))}
										</SidebarMenu>
									</div>
								))}
							</div>
						) : (
							<SidebarMenu>
								{recentThreads.map((thread) => (
									<ThreadLink
										key={thread.id}
										thread={thread}
										pathname={pathname}
									/>
								))}
							</SidebarMenu>
						)}
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="border-t border-sidebar-border p-2">
				<SidebarUserMenu user={user} />
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}
