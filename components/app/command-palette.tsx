"use client";

import { useClerk } from "@clerk/nextjs";
import {
	ChatCircleIcon,
	DesktopIcon,
	FileTextIcon,
	GearSixIcon,
	LayoutIcon,
	MoonIcon,
	PlusIcon,
	SignOutIcon,
	SparkleIcon,
	SunIcon,
	UserIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useRouter } from "nextjs-toploader/app";
import {
	createContext,
	use,
	useCallback,
	useEffect,
	useState,
	type ReactNode,
} from "react";

import { useSoftNav } from "@/components/app/soft-nav";
import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import { useSidebar } from "@/components/ui/sidebar";
import { getThreadHref, type ChatThreadListItem } from "@/lib/chats";
import {
	flatChatThreads,
	useChatThreadsInfinite,
} from "@/lib/chats-query";
import { MixpanelEvent, resetMixpanel, trackEvent } from "@/lib/mixpanel";
import { isStartTrialPath } from "@/lib/trial";
import {
	resumeDownloadPath,
	type ResumeListItem,
} from "@/lib/resumes";

type CommandPaletteContextValue = {
	open: boolean;
	setOpen: (open: boolean) => void;
};

const CommandPaletteContext =
	createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette() {
	const value = use(CommandPaletteContext);
	if (!value) {
		throw new Error(
			"useCommandPalette must be used within CommandPaletteProvider",
		);
	}
	return value;
}

type CommandPaletteProviderProps = {
	showUpgrade?: boolean;
	upgradeHref?: string;
	upgradeLabel?: string;
	children: ReactNode;
};

export function CommandPaletteProvider({
	showUpgrade = false,
	upgradeHref = "/settings",
	upgradeLabel = "Get Pro",
	children,
}: CommandPaletteProviderProps) {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key === "k") {
				event.preventDefault();
				setOpen((current) => !current);
			}
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	return (
		<CommandPaletteContext.Provider value={{ open, setOpen }}>
			{children}
			<CommandPaletteDialog
				showUpgrade={showUpgrade}
				upgradeHref={upgradeHref}
				upgradeLabel={upgradeLabel}
			/>
		</CommandPaletteContext.Provider>
	);
}

function resumeLabel(resume: ResumeListItem) {
	if (resume.roleTitle?.trim() && resume.companyName?.trim()) {
		return `${resume.roleTitle} @ ${resume.companyName}`;
	}
	return resume.roleTitle?.trim() || resume.name;
}

async function fetchResumes(): Promise<ResumeListItem[]> {
	const response = await fetch("/api/resumes");
	if (!response.ok) {
		throw new Error("Failed to load resumes");
	}
	const data = (await response.json()) as { resumes: ResumeListItem[] };
	return data.resumes;
}

function CommandPaletteDialog({
	showUpgrade,
	upgradeHref,
	upgradeLabel,
}: {
	showUpgrade: boolean;
	upgradeHref: string;
	upgradeLabel: string;
}) {
	const { open, setOpen } = useCommandPalette();
	const { openNewChat } = useSoftNav();
	const { setOpenMobile } = useSidebar();
	const { signOut, openUserProfile } = useClerk();
	const { theme, setTheme } = useTheme();
	const router = useRouter();
	const [search, setSearch] = useState("");

	const { data: chatsData, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useChatThreadsInfinite();
	const threads = flatChatThreads(chatsData);

	const resumesQuery = useQuery({
		queryKey: ["resumes", "list"],
		queryFn: fetchResumes,
		enabled: open,
	});
	const resumes = resumesQuery.data ?? [];

	useEffect(() => {
		if (!open || !hasNextPage || isFetchingNextPage) {
			return;
		}
		void fetchNextPage();
	}, [fetchNextPage, hasNextPage, isFetchingNextPage, open]);

	useEffect(() => {
		if (!open) {
			setSearch("");
		}
	}, [open]);

	const run = useCallback(
		(action: () => void) => {
			setOpen(false);
			setOpenMobile(false);
			action();
		},
		[setOpen, setOpenMobile],
	);

	const go = useCallback(
		(href: string) => {
			run(() => {
				router.push(href);
			});
		},
		[router, run],
	);

	const searching = search.trim().length > 0;
	const visibleThreads = searching ? threads : threads.slice(0, 6);
	const visibleResumes = searching ? resumes : resumes.slice(0, 6);

	return (
		<CommandDialog
			open={open}
			onOpenChange={setOpen}
			title="Search"
			description="Search chats, resumes, and settings"
			className="sm:max-w-xl"
		>
			<Command loop>
				<CommandInput
					placeholder="Search chats, resumes, settings..."
					value={search}
					onValueChange={setSearch}
				/>
				<CommandList>
					<CommandEmpty>No results found.</CommandEmpty>

					<CommandGroup heading="Actions">
						<CommandItem
							value="new chat start compose"
							keywords={["new", "chat", "compose", "start"]}
							onSelect={() => {
								run(() => {
									openNewChat();
								});
							}}
						>
							<PlusIcon size={16} weight="bold" />
							<span>New chat</span>
						</CommandItem>
					</CommandGroup>

					<CommandSeparator />

					<CommandGroup heading="Pages">
						<CommandItem
							value="chats all threads"
							onSelect={() => go("/chats")}
						>
							<ChatCircleIcon size={16} weight="duotone" />
							<span>Chats</span>
						</CommandItem>
						<CommandItem
							value="profile account"
							onSelect={() => go("/profile")}
						>
							<UserIcon size={16} weight="duotone" />
							<span>Profile</span>
						</CommandItem>
						<CommandItem
							value="resumes pdfs documents"
							onSelect={() => go("/resumes")}
						>
							<FileTextIcon size={16} weight="duotone" />
							<span>Resumes</span>
						</CommandItem>
						<CommandItem
							value="templates layouts"
							onSelect={() => go("/templates")}
						>
							<LayoutIcon size={16} weight="duotone" />
							<span>Templates</span>
						</CommandItem>
						<CommandItem
							value="settings billing plan usage subscription"
							keywords={["billing", "plan", "usage", "subscription"]}
							onSelect={() => go("/settings")}
						>
							<GearSixIcon size={16} weight="duotone" />
							<span>Settings</span>
						</CommandItem>
					</CommandGroup>

					{visibleThreads.length > 0 ? (
						<>
							<CommandSeparator />
							<CommandGroup heading="Chats">
								{visibleThreads.map((thread) => (
									<ChatCommandItem
										key={thread.id}
										thread={thread}
										onSelect={() => go(getThreadHref(thread))}
									/>
								))}
							</CommandGroup>
						</>
					) : null}

					{visibleResumes.length > 0 ? (
						<>
							<CommandSeparator />
							<CommandGroup heading="Resumes">
								{visibleResumes.map((resume) => (
									<ResumeCommandItem
										key={resume.id}
										resume={resume}
										onSelect={() => {
											const canPreview =
												resume.compileStatus === "ready" &&
												resume.hasPdf;
											if (canPreview) {
												run(() => {
													window.open(
														resumeDownloadPath(resume.id),
														"_blank",
														"noopener,noreferrer",
													);
												});
												return;
											}
											go("/resumes");
										}}
									/>
								))}
							</CommandGroup>
						</>
					) : null}

					<CommandSeparator />

					<CommandGroup heading="Settings">
						<CommandItem
							value="manage account clerk profile"
							onSelect={() => {
								run(() => {
									openUserProfile();
								});
							}}
						>
							<UserIcon size={16} weight="duotone" />
							<span>Manage account</span>
						</CommandItem>
						<CommandItem
							value="theme light appearance"
							keywords={["appearance", "mode"]}
							data-checked={theme === "light" || undefined}
							onSelect={() => {
								run(() => {
									setTheme("light");
								});
							}}
						>
							<SunIcon size={16} weight="duotone" />
							<span>Light theme</span>
						</CommandItem>
						<CommandItem
							value="theme dark appearance"
							keywords={["appearance", "mode"]}
							data-checked={theme === "dark" || undefined}
							onSelect={() => {
								run(() => {
									setTheme("dark");
								});
							}}
						>
							<MoonIcon size={16} weight="duotone" />
							<span>Dark theme</span>
						</CommandItem>
						<CommandItem
							value="theme system appearance"
							keywords={["appearance", "mode"]}
							data-checked={theme === "system" || undefined}
							onSelect={() => {
								run(() => {
									setTheme("system");
								});
							}}
						>
							<DesktopIcon size={16} weight="duotone" />
							<span>System theme</span>
						</CommandItem>
						{showUpgrade ? (
							<CommandItem
								value="upgrade pro plan billing"
								onSelect={() => {
									trackEvent(
										isStartTrialPath(upgradeHref)
											? MixpanelEvent.TrialStarted
											: MixpanelEvent.CheckoutStarted,
										{
											source: "command_palette",
										},
										{ sendImmediately: true },
									);
									go(upgradeHref);
								}}
							>
								<SparkleIcon size={16} weight="fill" />
								<span>{upgradeLabel}</span>
							</CommandItem>
						) : null}
						<CommandItem
							value="log out sign out"
							onSelect={() => {
								run(() => {
									trackEvent(MixpanelEvent.SignedOut, undefined, {
										sendImmediately: true,
									});
									resetMixpanel();
									void signOut({ redirectUrl: "/" });
								});
							}}
						>
							<SignOutIcon size={16} weight="duotone" />
							<span>Log out</span>
						</CommandItem>
					</CommandGroup>
				</CommandList>
			</Command>
		</CommandDialog>
	);
}

function ChatCommandItem({
	thread,
	onSelect,
}: {
	thread: ChatThreadListItem;
	onSelect: () => void;
}) {
	const Icon = thread.kind === "profile" ? UserIcon : ChatCircleIcon;

	return (
		<CommandItem
			value={`${thread.title} ${thread.preview} ${thread.id}`}
			keywords={[thread.preview, thread.kind === "profile" ? "profile" : "chat"]}
			onSelect={onSelect}
		>
			<Icon size={16} weight="duotone" />
			<span className="min-w-0 truncate">{thread.title}</span>
		</CommandItem>
	);
}

function ResumeCommandItem({
	resume,
	onSelect,
}: {
	resume: ResumeListItem;
	onSelect: () => void;
}) {
	const label = resumeLabel(resume);

	return (
		<CommandItem
			value={`${label} ${resume.name} ${resume.companyName ?? ""} ${resume.roleTitle ?? ""} ${resume.id}`}
			keywords={[
				resume.name,
				resume.companyName ?? "",
				resume.roleTitle ?? "",
			]}
			onSelect={onSelect}
		>
			<FileTextIcon size={16} weight="duotone" />
			<span className="min-w-0 truncate">{label}</span>
		</CommandItem>
	);
}
