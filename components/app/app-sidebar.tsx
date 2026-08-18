"use client";

import Link from "next/link";
import {
	ChatCircleIcon,
	DotsThreeIcon,
	FileTextIcon,
	LayoutIcon,
	MagnifyingGlassIcon,
	PencilSimpleIcon,
	PlusIcon,
	SidebarSimpleIcon,
	SlidersHorizontalIcon,
	SparkleIcon,
	TrashIcon,
	UserIcon,
} from "@phosphor-icons/react";
import { useRouter } from "nextjs-toploader/app";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	useSidebar,
} from "@/components/ui/sidebar";
import { LogoMark } from "@/components/brand/logo-mark";
import { useCommandPalette } from "@/components/app/command-palette";
import { SidebarUserMenu, type SidebarUser } from "@/components/app/sidebar-user-menu";
import { useSoftNav, useSoftPathname } from "@/components/app/soft-nav";
import {
	type ChatThreadListItem,
	getChatThreadHref,
	getProfileChatThreadHref,
	getThreadHref,
} from "@/lib/chats";
import {
	deleteChatThreadRequest,
	flatChatThreads,
	removeThreadFromCache,
	renameChatThreadRequest,
	renameThreadInCache,
	useChatThreadsInfinite,
} from "@/lib/chats-query";
import { MixpanelEvent, trackEvent } from "@/lib/mixpanel";
import { cn } from "@/lib/utils";

const navIconSlot =
	"flex w-9 shrink-0 items-center justify-center";

function BrandSidebarTrigger() {
	const { toggleSidebar, state } = useSidebar();
	const expanded = state === "expanded";

	return (
		<Button
			data-sidebar="trigger"
			data-slot="sidebar-trigger"
			variant="ghost"
			size="icon-sm"
			className="group/brand relative size-9 text-muted-foreground"
			onClick={toggleSidebar}
		>
			<LogoMark
				size={20}
				className={cn(
					"text-brand transition-opacity",
					expanded
						? "opacity-100 group-hover/brand:opacity-0"
						: "opacity-0",
				)}
			/>
			<SidebarSimpleIcon
				size={18}
				weight="duotone"
				className={cn(
					"absolute transition-opacity",
					expanded
						? "opacity-0 group-hover/brand:opacity-100"
						: "opacity-100",
				)}
			/>
			<span className="sr-only">Toggle Sidebar</span>
		</Button>
	);
}

const primaryNav = [
	{ title: "New chat", href: "/new-chat", icon: PlusIcon, exact: true },
	{ title: "Chats", href: "/chats", icon: ChatCircleIcon, exact: true },
	{ title: "Profile", href: "/profile", icon: UserIcon },
	{ title: "Resumes", href: "/resumes", icon: FileTextIcon },
	{ title: "Templates", href: "/templates", icon: LayoutIcon },
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
	href,
}: {
	thread: ChatThreadListItem;
	pathname: string;
	href: string;
}) {
	const isActive =
		pathname === href ||
		pathname === getChatThreadHref(thread.id) ||
		pathname === getProfileChatThreadHref(thread.id);
	const queryClient = useQueryClient();
	const router = useRouter();
	const { openNewChat } = useSoftNav();
	const { setOpenMobile } = useSidebar();
	const [renameOpen, setRenameOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [titleInput, setTitleInput] = useState(thread.title);

	const renameMutation = useMutation({
		mutationFn: (title: string) => renameChatThreadRequest(thread.id, title),
		onSuccess: (updated) => {
			renameThreadInCache(queryClient, thread.id, updated.title);
			setRenameOpen(false);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: () => deleteChatThreadRequest(thread.id),
		onSuccess: () => {
			removeThreadFromCache(queryClient, thread.id);
			setDeleteOpen(false);
			if (isActive) {
				if (pathname.startsWith("/profile")) {
					router.push("/profile");
				} else {
					openNewChat();
				}
			}
		},
	});

	const handleRenameOpenChange = (open: boolean) => {
		if (open) {
			setTitleInput(thread.title);
		}
		setRenameOpen(open);
	};

	const handleRenameSubmit = () => {
		const title = titleInput.trim();
		if (!title || title === thread.title) {
			setRenameOpen(false);
			return;
		}
		renameMutation.mutate(title);
	};

	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				render={
					<Link
						href={href}
						prefetch={false}
						onClick={() => setOpenMobile(false)}
					/>
				}
				isActive={isActive}
				tooltip={thread.title}
				className="px-2 text-muted-foreground"
			>
				<span className="truncate">{thread.title}</span>
			</SidebarMenuButton>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<SidebarMenuAction
							showOnHover
							aria-label="Chat options"
							className="top-1/2 right-1 size-6 w-6 -translate-y-1/2 cursor-pointer hover:bg-sidebar-border hover:text-sidebar-foreground peer-data-[size=default]/menu-button:top-1/2"
						/>
					}
				>
					<DotsThreeIcon size={16} weight="bold" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" side="right" className="w-44">
					<DropdownMenuGroup>
						<DropdownMenuItem onClick={() => handleRenameOpenChange(true)}>
							<PencilSimpleIcon size={18} weight="duotone" />
							Rename
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							variant="destructive"
							onClick={() => setDeleteOpen(true)}
						>
							<TrashIcon size={18} weight="duotone" />
							Delete
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>

			<Dialog open={renameOpen} onOpenChange={handleRenameOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Rename chat</DialogTitle>
					</DialogHeader>
					<Input
						value={titleInput}
						onChange={(event) => setTitleInput(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								event.preventDefault();
								handleRenameSubmit();
							}
						}}
						autoFocus
					/>
					<DialogFooter>
						<DialogClose render={<Button variant="outline" />}>
							Cancel
						</DialogClose>
						<Button
							onClick={handleRenameSubmit}
							disabled={renameMutation.isPending}
						>
							Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete chat</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-muted-foreground">
						This will permanently delete &ldquo;{thread.title}&rdquo;. This
						action cannot be undone.
					</p>
					<DialogFooter>
						<DialogClose render={<Button variant="outline" />}>
							Cancel
						</DialogClose>
						<Button
							variant="destructive"
							onClick={() => deleteMutation.mutate()}
							disabled={deleteMutation.isPending}
						>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</SidebarMenuItem>
	);
}

type AppSidebarProps = {
	user: SidebarUser;
	initialThreads: ChatThreadListItem[];
	initialHasMore?: boolean;
	showUpgrade?: boolean;
	upgradeHref?: string;
};

export function AppSidebar({
	user,
	initialThreads,
	initialHasMore = false,
	showUpgrade = false,
	upgradeHref = "/settings",
}: AppSidebarProps) {
	const pathname = useSoftPathname();
	const { openNewChat } = useSoftNav();
	const { setOpen: setCommandOpen } = useCommandPalette();
	const { state, setOpenMobile } = useSidebar();
	const collapsed = state === "collapsed";
	const [groupBy, setGroupBy] = useState<RecentsGroupBy>("none");
	const loadMoreRef = useRef<HTMLDivElement | null>(null);

	const handleOpenNewChat = () => {
		setOpenMobile(false);
		openNewChat();
	};

	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useChatThreadsInfinite({
		initialThreads,
		initialHasMore,
	});

	const threads = flatChatThreads(data);

	useEffect(() => {
		const stored = window.localStorage.getItem(GROUP_BY_KEY);
		if (stored === "none" || stored === "date") {
			setGroupBy(stored);
		}
	}, []);

	useEffect(() => {
		const node = loadMoreRef.current;
		if (!node || !hasNextPage || collapsed) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (
					entries.some((entry) => entry.isIntersecting) &&
					!isFetchingNextPage
				) {
					void fetchNextPage();
				}
			},
			{ root: node.closest('[data-sidebar="content"]'), rootMargin: "120px" },
		);

		observer.observe(node);
		return () => observer.disconnect();
	}, [
		collapsed,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		threads.length,
	]);

	const dateGroups = groupBy === "date" ? groupThreadsByDate(threads) : [];

	const handleGroupByChange = (value: string) => {
		if (value !== "none" && value !== "date") {
			return;
		}
		setGroupBy(value);
		window.localStorage.setItem(GROUP_BY_KEY, value);
	};

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader className="h-12 overflow-hidden px-1.5 py-0">
				<div className="flex h-full w-full items-center">
					<div className={navIconSlot}>
						<BrandSidebarTrigger />
					</div>
					<button
						type="button"
						onClick={handleOpenNewChat}
						className="flex min-w-0 flex-1 items-center overflow-hidden rounded-xl px-1 text-left group-data-[collapsible=icon]:invisible group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:flex-none"
					>
						<span className="truncate font-display text-[16px] font-semibold tracking-[-0.4px] text-sidebar-foreground">
							YourUnique.cv
						</span>
					</button>
					<Button
						variant="ghost"
						size="icon-sm"
						className="mr-1 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden"
						aria-label="Search"
						aria-keyshortcuts="Meta+K Control+K"
						title="Search (⌘K)"
						onClick={() => {
							setOpenMobile(false);
							setCommandOpen(true);
						}}
					>
						<MagnifyingGlassIcon size={16} weight="duotone" />
					</Button>
				</div>
			</SidebarHeader>

			<SidebarContent className="gap-2 pb-4">
				<SidebarGroup className="px-1.5">
					<SidebarGroupContent>
						<SidebarMenu className="gap-1">
							<SidebarMenuItem className="hidden group-data-[collapsible=icon]:block">
								<SidebarMenuButton
									tooltip="Search"
									onClick={() => setCommandOpen(true)}
								>
									<span className={navIconSlot}>
										<MagnifyingGlassIcon size={16} weight="duotone" />
									</span>
									<span className="min-w-0 truncate pr-2">
										Search
									</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
							{primaryNav.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										render={
											item.href === "/new-chat" ? (
												<button
													type="button"
													onClick={handleOpenNewChat}
												/>
											) : (
												<Link
													href={item.href}
													prefetch={false}
													onClick={() => setOpenMobile(false)}
												/>
											)
										}
										isActive={isActivePath(
											pathname,
											item.href,
											"exact" in item ? item.exact : false,
										)}
										tooltip={item.title}
									>
										<span className={navIconSlot}>
											{item.title === "New chat" ? (
												<span className="flex size-6 items-center justify-center rounded-full bg-brand text-brand-foreground">
													<item.icon size={14} weight="bold" />
												</span>
											) : (
												<item.icon size={16} weight="duotone" />
											)}
										</span>
										<span className="min-w-0 truncate pr-2">
											{item.title}
										</span>
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
								<SlidersHorizontalIcon size={16} weight="duotone" />
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
						{threads.length === 0 ? (
							<p className="px-2 text-[12px] text-muted-soft">
								No chats yet
							</p>
						) : groupBy === "date" ? (
							<div className="flex flex-col gap-2">
								{dateGroups.map((group) => (
									<div key={group.label}>
										<p className="px-2 py-1 text-[11px] font-medium tracking-[-0.1px] text-muted-soft">
											{group.label}
										</p>
										<SidebarMenu className="gap-0.5">
											{group.threads.map((thread) => (
												<ThreadLink
													key={thread.id}
													thread={thread}
													pathname={pathname}
													href={getThreadHref(thread)}
												/>
											))}
										</SidebarMenu>
									</div>
								))}
							</div>
						) : (
							<SidebarMenu className="gap-0.5">
								{threads.map((thread) => (
									<ThreadLink
										key={thread.id}
										thread={thread}
										pathname={pathname}
										href={getThreadHref(thread)}
									/>
								))}
							</SidebarMenu>
						)}
						{hasNextPage ? (
							<div
								ref={loadMoreRef}
								className="px-2 py-2 text-[11px] text-muted-soft"
								aria-hidden={!isFetchingNextPage}
							>
								{isFetchingNextPage ? "Loading…" : null}
							</div>
						) : null}
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="overflow-hidden px-1.5 py-2">
				{showUpgrade ? (
					<a
						href={upgradeHref}
						onClick={() => {
							trackEvent(
								MixpanelEvent.CheckoutStarted,
								{
									source: "sidebar",
								},
								{ sendImmediately: true },
							);
							setOpenMobile(false);
						}}
						className="mb-1 flex h-9 items-center overflow-hidden rounded-full bg-brand text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
					>
						<span className={navIconSlot}>
							<SparkleIcon size={16} weight="fill" />
						</span>
						<span className="truncate pr-2">
							Upgrade to Pro
						</span>
					</a>
				) : null}
				<SidebarUserMenu user={user} />
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}
