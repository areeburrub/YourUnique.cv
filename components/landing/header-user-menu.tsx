"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import {
	DesktopIcon,
	MoonIcon,
	SignOutIcon,
	SunIcon,
	UserIcon,
} from "@phosphor-icons/react";
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
import { cn } from "@/lib/utils";

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

const themes = [
	{ value: "light", label: "Light", Icon: SunIcon },
	{ value: "dark", label: "Dark", Icon: MoonIcon },
	{ value: "system", label: "System", Icon: DesktopIcon },
] as const;

export function HeaderUserMenu() {
	const { user } = useUser();
	const { signOut, openUserProfile } = useClerk();
	const { theme, setTheme } = useTheme();

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
				<Avatar size="lg" className="size-11">
					{user.imageUrl ? (
						<AvatarImage src={user.imageUrl} alt={name} />
					) : null}
					<AvatarFallback className="bg-muted text-[13px] font-medium">
						{initials}
					</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-60"
				side="bottom"
				align="end"
				sideOffset={8}
			>
				<div className="px-2.5 py-2 text-sm text-muted-foreground">
					{email || name}
				</div>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem onClick={() => openUserProfile()}>
						<UserIcon size={18} weight="duotone" />
						Manage account
					</DropdownMenuItem>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>
							<SunIcon size={18} weight="duotone" className="dark:hidden" />
							<MoonIcon size={18} weight="duotone" className="hidden dark:block" />
							Theme
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent className="w-44">
							{themes.map(({ value, label, Icon }) => (
								<DropdownMenuItem
									key={value}
									onClick={() => setTheme(value)}
									className={cn(
										theme === value &&
											"bg-accent text-accent-foreground",
									)}
								>
									<Icon
										size={18}
										weight={theme === value ? "fill" : "duotone"}
									/>
									{label}
								</DropdownMenuItem>
							))}
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					variant="destructive"
					onClick={() => signOut({ redirectUrl: "/" })}
				>
					<SignOutIcon size={18} weight="duotone" />
					Log out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
