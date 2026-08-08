"use client";

import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import {
	ChevronsUpDown,
	LogOut,
	Monitor,
	Moon,
	Settings2,
	Sun,
	UserRound,
} from "lucide-react";
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";

export type SidebarUser = {
	name: string;
	email: string;
	imageUrl?: string | null;
};

function getInitials(name: string, email: string) {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length >= 2) {
		return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
	}
	if (name.trim()) {
		return name.slice(0, 2).toUpperCase();
	}
	if (email) {
		return email.slice(0, 2).toUpperCase();
	}
	return "YU";
}

type SidebarUserMenuProps = {
	user: SidebarUser;
	compact?: boolean;
};

export function SidebarUserMenu({ user, compact = false }: SidebarUserMenuProps) {
	const { signOut, openUserProfile } = useClerk();
	const { isMobile, state, setOpenMobile } = useSidebar();
	const { setTheme } = useTheme();
	const collapsed = state === "collapsed";

	const initials = getInitials(user.name, user.email);

	const avatar = (
		<Avatar size="sm" className="size-8 after:border-sidebar-border">
			{user.imageUrl ? (
				<AvatarImage src={user.imageUrl} alt={user.name} />
			) : null}
			<AvatarFallback className="bg-sidebar-accent text-[11px] font-medium text-sidebar-accent-foreground">
				{initials}
			</AvatarFallback>
		</Avatar>
	);

	const menuContent = (
		<>
			<div className="px-2 py-1.5 text-xs text-muted-foreground">
				{user.email || user.name}
			</div>
			<DropdownMenuSeparator />
			<DropdownMenuGroup>
				<DropdownMenuItem
					className="gap-2"
					onClick={() => openUserProfile()}
				>
					<UserRound className="size-4" />
					Manage account
				</DropdownMenuItem>
				<DropdownMenuItem
					render={
						<Link
							href="/settings"
							onClick={() => setOpenMobile(false)}
						/>
					}
					className="gap-2"
				>
					<Settings2 className="size-4" />
					Settings
				</DropdownMenuItem>
				<DropdownMenuSub>
					<DropdownMenuSubTrigger className="gap-2">
						<Sun className="size-4 dark:hidden" />
						<Moon className="hidden size-4 dark:block" />
						Theme
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent className="min-w-36">
						<DropdownMenuItem
							onClick={() => setTheme("light")}
							className="gap-2"
						>
							<Sun className="size-4" />
							Light
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => setTheme("dark")}
							className="gap-2"
						>
							<Moon className="size-4" />
							Dark
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => setTheme("system")}
							className="gap-2"
						>
							<Monitor className="size-4" />
							System
						</DropdownMenuItem>
					</DropdownMenuSubContent>
				</DropdownMenuSub>
			</DropdownMenuGroup>
			<DropdownMenuSeparator />
			<DropdownMenuItem
				variant="destructive"
				className="gap-2"
				onClick={() => signOut({ redirectUrl: "/" })}
			>
				<LogOut className="size-4" />
				Log out
			</DropdownMenuItem>
		</>
	);

	if (compact) {
		return (
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<button
							type="button"
							aria-label="Open user menu"
							className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
						/>
					}
				>
					{avatar}
				</DropdownMenuTrigger>
				<DropdownMenuContent
					className="w-64 min-w-56 rounded-lg"
					side="bottom"
					align="end"
					sideOffset={8}
				>
					{menuContent}
				</DropdownMenuContent>
			</DropdownMenu>
		);
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<SidebarMenuButton
								size="lg"
								tooltip={user.name}
								className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
							/>
						}
					>
						{avatar}
						<div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
							<span className="truncate font-medium">{user.name}</span>
							<span className="truncate text-[12px] text-muted-soft">
								{user.email}
							</span>
						</div>
						<ChevronsUpDown className="ml-auto size-4 text-muted-soft group-data-[collapsible=icon]:hidden" />
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-64 min-w-56 rounded-lg"
						side={isMobile ? "bottom" : collapsed ? "right" : "top"}
						align="start"
						sideOffset={8}
					>
						{menuContent}
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
