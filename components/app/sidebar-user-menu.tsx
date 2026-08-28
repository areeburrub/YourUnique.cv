"use client";

import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import {
	DesktopIcon,
	GearSixIcon,
	MoonIcon,
	SignOutIcon,
	SunIcon,
} from "@phosphor-icons/react";
import { useTheme } from "next-themes";

import { MixpanelEvent, resetMixpanel, trackEvent } from "@/lib/mixpanel";
import { cn } from "@/lib/utils";

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

export function SidebarUserMenu({ user }: { user: SidebarUser }) {
	const { signOut } = useClerk();
	const { theme, setTheme } = useTheme();
	const initials = getInitials(user.name, user.email);

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
				<Avatar className="size-8 md:size-9">
					{user.imageUrl ? (
						<AvatarImage src={user.imageUrl} alt={user.name} />
					) : null}
					<AvatarFallback className="bg-muted text-[11px] font-medium">
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
					{user.email || user.name}
				</div>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem render={<Link href="/settings" />}>
						<GearSixIcon size={18} weight="duotone" />
						Settings
					</DropdownMenuItem>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>
							<SunIcon
								size={18}
								weight="duotone"
								className="dark:hidden"
							/>
							<MoonIcon
								size={18}
								weight="duotone"
								className="hidden dark:block"
							/>
							Theme
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent className="w-44">
							{(
								[
									{
										value: "light",
										label: "Light",
										Icon: SunIcon,
									},
									{
										value: "dark",
										label: "Dark",
										Icon: MoonIcon,
									},
									{
										value: "system",
										label: "System",
										Icon: DesktopIcon,
									},
								] as const
							).map(({ value, label, Icon }) => (
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
										weight={
											theme === value ? "fill" : "duotone"
										}
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
					onClick={() => {
						trackEvent(MixpanelEvent.SignedOut, undefined, {
							sendImmediately: true,
						});
						resetMixpanel();
						void signOut({ redirectUrl: "/" });
					}}
				>
					<SignOutIcon size={18} weight="duotone" />
					Log out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
