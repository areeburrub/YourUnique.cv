"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import {
	LogOut,
	Monitor,
	Moon,
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

export function HeaderUserMenu() {
	const { user } = useUser();
	const { signOut, openUserProfile } = useClerk();
	const { setTheme } = useTheme();

	if (!user) {
		return null;
	}

	const name = user.fullName || user.firstName || "Account";
	const email =
		user.primaryEmailAddress?.emailAddress ||
		user.emailAddresses[0]?.emailAddress ||
		"";
	const initials = getInitials(name, email);

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
				<Avatar size="sm" className="size-8">
					{user.imageUrl ? (
						<AvatarImage src={user.imageUrl} alt={name} />
					) : null}
					<AvatarFallback className="bg-muted text-[11px] font-medium">
						{initials}
					</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-64 min-w-56 rounded-lg"
				side="bottom"
				align="end"
				sideOffset={8}
			>
				<div className="px-2 py-1.5 text-xs text-muted-foreground">
					{email || name}
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
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
