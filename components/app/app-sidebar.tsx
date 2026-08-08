"use client";

import Link from "next/link";
import {
	FileText,
	MessageSquare,
	MoreHorizontal,
	Pencil,
	Plus,
	Search,
	SlidersHorizontal,
	Trash2,
	UserRound,
} from "lucide-react";
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
	SidebarTrigger,
	useSidebar,
} from "@/components/ui/sidebar";
import { SidebarUserMenu, type SidebarUser } from "@/components/app/sidebar-user-menu";
import { useSoftNav, useSoftPathname } from "@/components/app/soft-nav";
import {
	type ChatThreadListItem,
	getChatThreadHref,
	getProfileChatThreadHref,
} from "@/lib/chats";
import {
	deleteChatThreadRequest,
	flatChatThreads,
	removeThreadFromCache,
	renameChatThreadRequest,
	renameThreadInCache,
	useChatThreadsInfinite,
} from "@/lib/chats-query";
import {
	deleteProfileChatThreadRequest,
	removeProfileThreadFromCache,
	renameProfileChatThreadRequest,
	renameProfileThreadInCache,
	useProfileChatThreadsInfinite,
} from "@/lib/profile-chats-query";

const primaryNav = [
	{ title: "New chat", href: "/new-chat", icon: Plus, exact: true },
	{ title: "Chats", href: "/chats", icon: MessageSquare, exact: true },
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
	href,
	mode,
}: {
	thread: ChatThreadListItem;
	pathname: string;
	href: string;
	mode: "resume" | "profile";
}) {
	const isActive = pathname === href;
	const queryClient = useQueryClient();
	const router = useRouter();
	const { openNewChat } = useSoftNav();
	const { setOpenMobile } = useSidebar();
	const [renameOpen, setRenameOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [titleInput, setTitleInput] = useState(thread.title);

	const renameMutation = useMutation({
		mutationFn: (title: string) =>
			mode === "profile"
				? renameProfileChatThreadRequest(thread.id, title)
				: renameChatThreadRequest(thread.id, title),
		onSuccess: (updated) => {
			if (mode === "profile") {
				renameProfileThreadInCache(queryClient, thread.id, updated.title);
			} else {
				renameThreadInCache(queryClient, thread.id, updated.title);
			}
			setRenameOpen(false);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: () =>
			mode === "profile"
				? deleteProfileChatThreadRequest(thread.id)
				: deleteChatThreadRequest(thread.id),
		onSuccess: () => {
			if (mode === "profile") {
				removeProfileThreadFromCache(queryClient, thread.id);
			} else {
				removeThreadFromCache(queryClient, thread.id);
			}
			setDeleteOpen(false);
			if (isActive) {
				if (mode === "profile") {
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
				className="text-muted-foreground"
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
					<MoreHorizontal />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" side="right" className="min-w-40">
					<DropdownMenuGroup>
						<DropdownMenuItem onClick={() => handleRenameOpenChange(true)}>
							<Pencil />
							Rename
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							variant="destructive"
							onClick={() => setDeleteOpen(true)}
						>
							<Trash2 />
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
};

export function AppSidebar({
	user,
	initialThreads,
	initialHasMore = false,
}: AppSidebarProps) {
	const pathname = useSoftPathname();
	const { openNewChat } = useSoftNav();
	const { state, setOpenMobile } = useSidebar();
	const collapsed = state === "collapsed";
	const [groupBy, setGroupBy] = useState<RecentsGroupBy>("none");
	const loadMoreRef = useRef<HTMLDivElement | null>(null);
	const onProfile = pathname === "/profile" || pathname.startsWith("/profile/");

	const handleOpenNewChat = () => {
		setOpenMobile(false);
		openNewChat();
	};

	const resumeQuery = useChatThreadsInfinite({
		initialThreads,
		initialHasMore,
	});

	const profileQuery = useProfileChatThreadsInfinite({
		enabled: onProfile,
	});

	const data = onProfile ? profileQuery.data : resumeQuery.data;
	const fetchNextPage = onProfile
		? profileQuery.fetchNextPage
		: resumeQuery.fetchNextPage;
	const hasNextPage = onProfile
		? profileQuery.hasNextPage
		: resumeQuery.hasNextPage;
	const isFetchingNextPage = onProfile
		? profileQuery.isFetchingNextPage
		: resumeQuery.isFetchingNextPage;

	const threads = flatChatThreads(data);
	const recentsMode = onProfile ? "profile" : "resume";
	const threadHref = onProfile
		? getProfileChatThreadHref
		: getChatThreadHref;

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
			<SidebarHeader className="h-14 p-0">
				{collapsed ? (
					<div className="flex size-full items-center justify-center p-2">
						<SidebarTrigger className="size-8 text-muted-foreground" />
					</div>
				) : (
					<div className="flex h-full w-full items-center gap-1 px-3">
						<button
							type="button"
							onClick={handleOpenNewChat}
							className="flex min-w-0 flex-1 items-center overflow-hidden rounded-control px-1 text-left"
						>
							<span className="truncate font-display text-[18px] font-semibold tracking-[-0.4px] text-sidebar-foreground">
								YourUnique.cv
							</span>
						</button>
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
						<SidebarMenu className="gap-0.5">
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
						{threads.length === 0 ? (
							<p className="px-2 text-[12px] text-muted-soft">
								{onProfile ? "No profile chats yet" : "No chats yet"}
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
													href={threadHref(thread.id)}
													mode={recentsMode}
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
										href={threadHref(thread.id)}
										mode={recentsMode}
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

			<SidebarFooter className="border-t border-sidebar-border p-2">
				<SidebarUserMenu user={user} />
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}
