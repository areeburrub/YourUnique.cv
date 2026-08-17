"use client";

import Link from "next/link";
import { ChatCircleIcon, PlusIcon } from "@phosphor-icons/react";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { useSoftNav } from "@/components/app/soft-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	type ChatThreadListItem,
	getChatThreadHref,
} from "@/lib/chats";
import {
	flatChatThreads,
	useChatThreadsInfinite,
} from "@/lib/chats-query";
import { cn } from "@/lib/utils";

import { ChatsSearchInput } from "./chats-search-input";

function formatUpdatedAt(iso: string) {
	const date = new Date(iso);
	const now = new Date();
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
		return date.toLocaleTimeString(undefined, {
			hour: "numeric",
			minute: "2-digit",
		});
	}
	if (dayDiff === 1) {
		return "Yesterday";
	}
	if (dayDiff < 7) {
		return date.toLocaleDateString(undefined, { weekday: "short" });
	}
	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});
}

function filterThreads(threads: ChatThreadListItem[], query: string) {
	const needle = query.trim().toLowerCase();
	if (!needle) {
		return threads;
	}
	return threads.filter(
		(thread) =>
			thread.title.toLowerCase().includes(needle) ||
			thread.preview.toLowerCase().includes(needle),
	);
}

type ChatsIndexProps = {
	initialThreads: ChatThreadListItem[];
	initialHasMore: boolean;
};

export function ChatsIndex({
	initialThreads,
	initialHasMore,
}: ChatsIndexProps) {
	const { openNewChat } = useSoftNav();
	const searchParams = useSearchParams();
	const query = searchParams.get("q") ?? "";

	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useChatThreadsInfinite({
		initialThreads,
		initialHasMore,
	});

	useEffect(() => {
		if (hasNextPage && !isFetchingNextPage) {
			void fetchNextPage();
		}
	}, [fetchNextPage, hasNextPage, isFetchingNextPage]);

	const threads = flatChatThreads(data);
	const filtered = filterThreads(threads, query);

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<div className="shrink-0 border-b border-border px-4 py-5 sm:px-6">
				<div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<h1 className="font-display text-[24px] font-medium tracking-[-0.48px] text-foreground">
								Chats
							</h1>
							<p className="mt-1 text-sm text-muted-foreground">
								All of your resume tailoring threads in one place.
							</p>
						</div>
						<Button
							type="button"
							className="shrink-0"
							onClick={openNewChat}
						>
							<PlusIcon data-icon="inline-start" weight="bold" />
							New chat
						</Button>
					</div>
					{threads.length > 0 ? (
						<Suspense
							fallback={
								<div className="relative">
									<Input
										placeholder="Search chats"
										className="h-11 pl-10"
										disabled
										aria-label="Search chats"
									/>
								</div>
							}
						>
							<ChatsSearchInput />
						</Suspense>
					) : null}
				</div>
			</div>

			<div className="min-h-0 flex-1 overflow-auto">
				<div className="mx-auto w-full max-w-3xl px-4 py-2 sm:px-6">
					{filtered.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
							<div className="flex size-16 items-center justify-center rounded-[22px] bg-pastel-blush text-brand">
								<ChatCircleIcon size={28} weight="duotone" />
							</div>
							<div className="space-y-1">
								<h2 className="font-medium text-sm">
									{query.trim()
										? "No matching chats"
										: "No chats yet"}
								</h2>
								<p className="max-w-sm text-sm text-muted-foreground">
									{query.trim()
										? "Try a different search, or start a new chat."
										: "Paste a job description to start your first thread."}
								</p>
							</div>
							{!query.trim() ? (
								<Button
									type="button"
									className="mt-1"
									onClick={openNewChat}
								>
									<PlusIcon data-icon="inline-start" weight="bold" />
									New chat
								</Button>
							) : null}
						</div>
					) : (
						<ul className="divide-y divide-border">
							{filtered.map((thread) => (
								<li key={thread.id}>
									<Link
										href={getChatThreadHref(thread.id)}
										className={cn(
											"group flex items-start gap-3 py-4 transition-colors",
											"hover:bg-surface-subtle/80",
											"-mx-2 rounded-control px-2 sm:-mx-3 sm:px-3",
										)}
									>
										<div className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-pastel-blush text-brand transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
											<ChatCircleIcon size={20} weight="duotone" />
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-baseline justify-between gap-3">
												<h2 className="truncate text-sm font-medium text-foreground">
													{thread.title}
												</h2>
												<span className="shrink-0 text-[12px] text-muted-soft">
													{formatUpdatedAt(thread.updatedAt)}
												</span>
											</div>
											{thread.preview ? (
												<p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
													{thread.preview}
												</p>
											) : null}
											{typeof thread.messageCount === "number" ? (
												<p className="mt-1 text-[12px] text-muted-soft">
													{thread.messageCount}{" "}
													{thread.messageCount === 1
														? "message"
														: "messages"}
												</p>
											) : null}
										</div>
									</Link>
								</li>
							))}
						</ul>
					)}
					{isFetchingNextPage ? (
						<p className="px-2 py-4 text-center text-[12px] text-muted-soft">
							Loading…
						</p>
					) : null}
				</div>
			</div>
		</div>
	);
}
