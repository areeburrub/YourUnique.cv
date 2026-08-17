"use client";

import type { UIMessage } from "ai";
import { FileTextIcon } from "@phosphor-icons/react";
import { useRouter } from "nextjs-toploader/app";
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

import {
	ChatView,
	type ChatContextSnippet,
} from "@/components/chat/chat-view";

import { ProfileEditor } from "./profile-editor";
import { SelectionToChat } from "./selection-to-chat";

type ProfileWorkspaceProps = {
	threadId?: string;
	initialProfile: string;
	initialUpdatedAt?: string | null;
	initialMessages?: UIMessage[];
};

function formatLastEdited(value: string | null) {
	if (!value) {
		return null;
	}
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return null;
	}
	return new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(date);
}

function ProfileArtifactHeader({
	lastEditedLabel,
	trailing,
}: {
	lastEditedLabel: string | null;
	trailing?: ReactNode;
}) {
	return (
		<div className="flex shrink-0 items-center gap-3 px-4 py-3">
			<div className="flex min-w-0 flex-1 items-center gap-2.5">
				<span className="flex size-8 items-center justify-center rounded-xl bg-pastel-blush text-brand">
					<FileTextIcon size={16} weight="duotone" className="shrink-0" />
				</span>
				<p className="truncate text-sm font-medium text-foreground">Your Profile</p>
			</div>
			{lastEditedLabel ? (
				<p className="hidden min-w-0 shrink truncate text-xs text-muted-foreground sm:block">
					Last edited on {lastEditedLabel}
				</p>
			) : null}
			{trailing}
		</div>
	);
}

export function ProfileWorkspace({
	threadId,
	initialProfile,
	initialUpdatedAt = null,
	initialMessages = [],
}: ProfileWorkspaceProps) {
	const router = useRouter();
	const [profile, setProfile] = useState(initialProfile);
	const [updatedAt, setUpdatedAt] = useState<string | null>(
		initialUpdatedAt,
	);
	const [snippets, setSnippets] = useState<ChatContextSnippet[]>([]);
	const [selection, setSelection] = useState<{
		text: string;
		rect: DOMRect | null;
	}>({ text: "", rect: null });
	const [freshChatKey, setFreshChatKey] = useState(0);
	const [isMobile, setIsMobile] = useState<boolean | null>(null);
	const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
	const editorPaneRef = useRef<HTMLDivElement>(null);
	const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
	const saveTimer = useRef<number | null>(null);

	useEffect(() => {
		const media = window.matchMedia("(max-width: 1023px)");
		const sync = () => {
			const mobile = media.matches;
			setIsMobile(mobile);
			if (!mobile) {
				setProfileDrawerOpen(false);
			}
		};
		sync();
		media.addEventListener("change", sync);
		return () => media.removeEventListener("change", sync);
	}, []);

	const persistProfile = useCallback(async (next: string) => {
		const trimmed = next.trim();
		if (!trimmed) {
			return;
		}

		try {
			const response = await fetch("/api/profile", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ profile: trimmed }),
			});
			if (!response.ok) {
				return;
			}
			const data = (await response.json().catch(() => null)) as {
				updatedAt?: string;
			} | null;
			if (typeof data?.updatedAt === "string") {
				setUpdatedAt(data.updatedAt);
			} else {
				setUpdatedAt(new Date().toISOString());
			}
		} catch {
			return;
		}
	}, []);

	const scheduleSave = useCallback(
		(next: string) => {
			if (saveTimer.current) {
				window.clearTimeout(saveTimer.current);
			}
			saveTimer.current = window.setTimeout(() => {
				void persistProfile(next);
			}, 600);
		},
		[persistProfile],
	);

	useEffect(() => {
		return () => {
			if (saveTimer.current) {
				window.clearTimeout(saveTimer.current);
			}
		};
	}, []);

	useEffect(() => {
		const node = editorPaneRef.current;
		if (!node) {
			return;
		}
		const update = () => setContainerRect(node.getBoundingClientRect());
		update();
		const observer = new ResizeObserver(update);
		observer.observe(node);
		window.addEventListener("scroll", update, true);
		return () => {
			observer.disconnect();
			window.removeEventListener("scroll", update, true);
		};
	}, [isMobile, profileDrawerOpen]);

	const handleEditorChange = useCallback(
		(next: string) => {
			setProfile(next);
			scheduleSave(next);
		},
		[scheduleSave],
	);

	const handleProfileUpdatedFromChat = useCallback((next: string) => {
		if (saveTimer.current) {
			window.clearTimeout(saveTimer.current);
		}
		setProfile(next);
		setUpdatedAt(new Date().toISOString());
	}, []);

	const [lastEditedLabel, setLastEditedLabel] = useState<string | null>(null);

	useEffect(() => {
		setLastEditedLabel(formatLastEdited(updatedAt));
	}, [updatedAt]);

	const addSnippet = useCallback((text: string) => {
		const trimmed = text.trim();
		if (!trimmed) {
			return;
		}
		setSnippets((current) => {
			if (current.some((item) => item.text === trimmed)) {
				return current;
			}
			return [...current, { id: crypto.randomUUID(), text: trimmed }];
		});
		setSelection({ text: "", rect: null });
		setProfileDrawerOpen(false);
	}, []);

	const chat = (
		<ChatView
			key={threadId ?? `fresh-${freshChatKey}`}
			variant="panel"
			chatSurface="profile"
			threadId={threadId}
			initialMessages={initialMessages}
			contextSnippets={snippets}
			onRemoveSnippet={(id) =>
				setSnippets((current) =>
					current.filter((item) => item.id !== id),
				)
			}
			onClearSnippets={() => setSnippets([])}
			onProfileUpdated={handleProfileUpdatedFromChat}
			onNewChat={() => {
				setSnippets([]);
				setSelection({ text: "", rect: null });
				if (threadId) {
					router.push("/profile");
					return;
				}
				setFreshChatKey((key) => key + 1);
			}}
			onOpenProfile={
				isMobile ? () => setProfileDrawerOpen(true) : undefined
			}
			className="h-full w-full"
		/>
	);

	const editor = (
		<div ref={editorPaneRef} className="relative min-h-0 flex-1">
			<ProfileEditor
				value={profile}
				onChange={handleEditorChange}
				onSelectionChange={setSelection}
				className="h-full"
			/>
			<SelectionToChat
				text={selection.text}
				rect={selection.rect}
				containerRect={containerRect}
				onAdd={addSnippet}
			/>
		</div>
	);

	return (
		<div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
			<div className="relative grid min-h-0 flex-1 lg:grid-cols-[minmax(300px,1fr)_minmax(0,1.35fr)]">
				<div className="flex min-h-0 flex-col bg-background">{chat}</div>

				{isMobile === false ? (
					<div className="relative flex min-h-0 flex-col bg-surface-subtle">
						<ProfileArtifactHeader lastEditedLabel={lastEditedLabel} />
						{editor}
					</div>
				) : null}
			</div>

			{isMobile ? (
				<>
					<Drawer
						open={profileDrawerOpen}
						onOpenChange={setProfileDrawerOpen}
						showSwipeHandle
					>
						<DrawerContent
							className={cn(
								"bg-surface-subtle",
								"data-[swipe-axis=y]:[--drawer-content-height:92dvh]",
								"data-[swipe-axis=y]:[--drawer-content-max-height:92dvh]",
							)}
						>
							<DrawerHeader className="sr-only">
								<DrawerTitle>Your Profile</DrawerTitle>
								<DrawerDescription>
									Edit your career profile document
								</DrawerDescription>
							</DrawerHeader>
							<ProfileArtifactHeader
								lastEditedLabel={lastEditedLabel}
								trailing={
									<DrawerClose
										render={
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="h-7 px-2 text-xs"
											/>
										}
									>
										Close
									</DrawerClose>
								}
							/>
							{editor}
						</DrawerContent>
					</Drawer>

				</>
			) : null}
		</div>
	);
}
