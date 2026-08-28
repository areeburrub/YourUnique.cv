"use client";

import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import {
	DesktopIcon,
	GearSixIcon,
	MoonIcon,
	SignOutIcon,
	SparkleIcon,
	SunIcon,
} from "@phosphor-icons/react";
import { useTheme } from "next-themes";

import { UsageBar } from "@/components/usage-bar";
import { MixpanelCheckoutLink } from "@/components/mixpanel-checkout-link";
import { buttonVariants } from "@/components/ui/button";
import { useSoftPathname } from "@/components/app/soft-nav";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUsageStatus } from "@/hooks/use-usage-status";
import { MixpanelEvent, resetMixpanel, trackEvent } from "@/lib/mixpanel";
import { usagePercent } from "@/lib/usage-status";
import { cn } from "@/lib/utils";

export type SidebarUser = {
	name: string;
	email: string;
	imageUrl?: string | null;
};

const RING_SIZE = 36;
const RING_STROKE = 2.5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const THEME_OPTIONS = [
	{ value: "light", label: "Light", Icon: SunIcon },
	{ value: "dark", label: "Dark", Icon: MoonIcon },
	{ value: "system", label: "System", Icon: DesktopIcon },
] as const;

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

function UsageAvatarRing({
	percent,
	children,
}: {
	percent: number;
	children: React.ReactNode;
}) {
	const offset = RING_CIRCUMFERENCE * (1 - percent / 100);
	return (
		<span className="relative inline-flex size-8 items-center justify-center">
			<svg
				className="absolute inset-0 size-full -rotate-90"
				viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
				aria-hidden
			>
				<circle
					cx={RING_SIZE / 2}
					cy={RING_SIZE / 2}
					r={RING_RADIUS}
					fill="none"
					className="stroke-muted"
					strokeWidth={RING_STROKE}
				/>
				<circle
					cx={RING_SIZE / 2}
					cy={RING_SIZE / 2}
					r={RING_RADIUS}
					fill="none"
					className="stroke-brand"
					strokeWidth={RING_STROKE}
					strokeDasharray={RING_CIRCUMFERENCE}
					strokeDashoffset={offset}
					strokeLinecap="round"
				/>
			</svg>
			{children}
		</span>
	);
}

function UserAvatar({ user, percent }: { user: SidebarUser; percent: number }) {
	const initials = getInitials(user.name, user.email);
	return (
		<UsageAvatarRing percent={percent}>
			<Avatar size="sm">
				{user.imageUrl ? (
					<AvatarImage src={user.imageUrl} alt={user.name} />
				) : null}
				<AvatarFallback className="bg-muted text-[11px] font-medium">
					{initials}
				</AvatarFallback>
			</Avatar>
		</UsageAvatarRing>
	);
}

const footerIconSlot = "flex w-9 shrink-0 items-center justify-center";

function FooterNavLabel({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<>
			<span className={footerIconSlot}>{children}</span>
			<span className="min-w-0 truncate pr-2">{label}</span>
		</>
	);
}

function UserUsageSummary({ user }: { user: SidebarUser }) {
	const { data } = useUsageStatus();
	return (
		<>
			<div className="truncate px-3 py-2 text-sm text-muted-foreground">
				{user.email || user.name}
			</div>
			<div className="px-3 pb-2">
				<UsageBar
					label="Monthly usage"
					used={data?.usage.rolling30d ?? 0}
					limit={data?.plan.monthlyLimitUsd ?? 0}
					resetAt={data?.monthlyResetAt}
					resetPrefix="Resets"
				/>
			</div>
		</>
	);
}

function signOutUser() {
	trackEvent(MixpanelEvent.SignedOut, undefined, {
		sendImmediately: true,
	});
	resetMixpanel();
}

export function MobileUserSidebarTrigger({ user }: { user: SidebarUser }) {
	const { toggleSidebar } = useSidebar();
	const { data } = useUsageStatus();
	const monthlyPercent = data
		? usagePercent(data.usage.rolling30d, data.plan.monthlyLimitUsd)
		: 0;

	return (
		<button
			type="button"
			data-sidebar="trigger"
			data-slot="sidebar-trigger"
			aria-label="Open menu"
			className="inline-flex size-8 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
			onClick={toggleSidebar}
		>
			<UserAvatar user={user} percent={monthlyPercent} />
		</button>
	);
}

export function SidebarUserAccount({
	user,
	showUpgrade = false,
	upgradeHref = "/api/checkout",
}: {
	user: SidebarUser;
	showUpgrade?: boolean;
	upgradeHref?: string;
}) {
	const { signOut } = useClerk();
	const { theme, setTheme } = useTheme();
	const { setOpenMobile } = useSidebar();
	const pathname = useSoftPathname();

	return (
		<div className="flex flex-col gap-1">
			<UserUsageSummary user={user} />
			<SidebarMenu className="gap-0.5">
				{showUpgrade ? (
					<SidebarMenuItem>
						<SidebarMenuButton
							render={
								<MixpanelCheckoutLink
									href={upgradeHref}
									source="sidebar"
								/>
							}
						>
							<FooterNavLabel label="Upgrade">
								<SparkleIcon size={16} weight="fill" />
							</FooterNavLabel>
						</SidebarMenuButton>
					</SidebarMenuItem>
				) : null}
				<SidebarMenuItem>
					<SidebarMenuButton
						isActive={pathname.startsWith("/settings")}
						render={
							<Link
								href="/settings"
								prefetch={false}
								onClick={() => setOpenMobile(false)}
							/>
						}
					>
						<FooterNavLabel label="Settings">
							<GearSixIcon size={16} weight="duotone" />
						</FooterNavLabel>
					</SidebarMenuButton>
				</SidebarMenuItem>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger render={<SidebarMenuButton />}>
							<FooterNavLabel label="Theme">
								<SunIcon
									size={16}
									weight="duotone"
									className="dark:hidden"
								/>
								<MoonIcon
									size={16}
									weight="duotone"
									className="hidden dark:block"
								/>
							</FooterNavLabel>
						</DropdownMenuTrigger>
						<DropdownMenuContent side="top" align="start" className="w-44">
							{THEME_OPTIONS.map(({ value, label, Icon }) => (
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
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
				<SidebarMenuItem>
					<SidebarMenuButton
						onClick={() => {
							signOutUser();
							void signOut({ redirectUrl: "/" });
						}}
						className="text-destructive hover:bg-destructive/10 hover:text-destructive"
					>
						<FooterNavLabel label="Log out">
							<SignOutIcon size={16} weight="duotone" />
						</FooterNavLabel>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		</div>
	);
}

export function SidebarUserMenu({
	user,
	showUpgrade = false,
	upgradeHref = "/api/checkout",
}: {
	user: SidebarUser;
	showUpgrade?: boolean;
	upgradeHref?: string;
}) {
	const { signOut } = useClerk();
	const { theme, setTheme } = useTheme();
	const { data } = useUsageStatus();
	const monthlyPercent = data
		? usagePercent(data.usage.rolling30d, data.plan.monthlyLimitUsd)
		: 0;

	return (
		<div className="flex h-8 items-center gap-1.5">
			{showUpgrade ? (
				<MixpanelCheckoutLink
					href={upgradeHref}
					source="header"
					className={cn(
						buttonVariants({ size: "xs" }),
						"hidden bg-brand text-brand-foreground hover:bg-brand/90 md:inline-flex",
					)}
				>
					<SparkleIcon data-icon="inline-start" weight="fill" />
					Upgrade
				</MixpanelCheckoutLink>
			) : null}
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<button
							type="button"
							aria-label={`Open user menu, monthly usage ${monthlyPercent}%`}
							className="inline-flex size-8 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
						/>
					}
				>
					<UserAvatar user={user} percent={monthlyPercent} />
				</DropdownMenuTrigger>
				<DropdownMenuContent
					className="w-60"
					side="bottom"
					align="end"
					sideOffset={8}
				>
					<UserUsageSummary user={user} />
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
								{THEME_OPTIONS.map(({ value, label, Icon }) => (
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
							signOutUser();
							void signOut({ redirectUrl: "/" });
						}}
					>
						<SignOutIcon size={18} weight="duotone" />
						Log out
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
