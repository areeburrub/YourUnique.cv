"use client";

import {
	type InfiniteData,
	type QueryClient,
	useInfiniteQuery,
} from "@tanstack/react-query";

import type { ChatThreadListItem } from "@/lib/chats";
import { CHATS_PAGE_SIZE } from "@/lib/chats";

export const chatsKeys = {
	all: ["chats"] as const,
	list: () => [...chatsKeys.all, "list"] as const,
	detail: (id: string) => [...chatsKeys.all, "detail", id] as const,
};

export type ChatsPage = {
	threads: ChatThreadListItem[];
	page: number;
	perPage: number;
	total: number;
	hasMore: boolean;
};

export type ChatThreadDetail = {
	id: string;
	title: string;
	updatedAt: string;
};

export async function fetchChatsPage(page: number): Promise<ChatsPage> {
	const response = await fetch(
		`/api/chats?page=${page}&limit=${CHATS_PAGE_SIZE}`,
	);
	if (!response.ok) {
		throw new Error("Failed to load chats");
	}
	return response.json() as Promise<ChatsPage>;
}

export async function fetchChatThread(
	id: string,
): Promise<ChatThreadDetail> {
	const response = await fetch(`/api/chats/${id}`);
	if (response.status === 404) {
		throw new Error("NOT_FOUND");
	}
	if (!response.ok) {
		throw new Error("Failed to load chat");
	}
	return response.json() as Promise<ChatThreadDetail>;
}

export async function renameChatThreadRequest(
	id: string,
	title: string,
): Promise<ChatThreadDetail> {
	const response = await fetch(`/api/chats/${id}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ title }),
	});
	if (!response.ok) {
		throw new Error("Failed to rename chat");
	}
	return response.json() as Promise<ChatThreadDetail>;
}

export async function deleteChatThreadRequest(id: string): Promise<void> {
	const response = await fetch(`/api/chats/${id}`, { method: "DELETE" });
	if (!response.ok) {
		throw new Error("Failed to delete chat");
	}
}

export function chatsInfiniteInitialData(
	threads: ChatThreadListItem[],
	hasMore: boolean,
): InfiniteData<ChatsPage, number> {
	return {
		pages: [
			{
				threads,
				page: 0,
				perPage: CHATS_PAGE_SIZE,
				total: threads.length,
				hasMore,
			},
		],
		pageParams: [0],
	};
}

export function useChatThreadsInfinite(options?: {
	initialThreads?: ChatThreadListItem[];
	initialHasMore?: boolean;
}) {
	const hasInitial = Boolean(options?.initialThreads);

	return useInfiniteQuery<
		ChatsPage,
		Error,
		InfiniteData<ChatsPage, number>,
		ReturnType<typeof chatsKeys.list>,
		number
	>({
		queryKey: chatsKeys.list(),
		queryFn: ({ pageParam }) => fetchChatsPage(pageParam),
		initialPageParam: 0,
		getNextPageParam: (lastPage) =>
			lastPage.hasMore ? lastPage.page + 1 : undefined,
		initialData: hasInitial
			? chatsInfiniteInitialData(
					options?.initialThreads ?? [],
					options?.initialHasMore ?? false,
				)
			: undefined,
		initialDataUpdatedAt: hasInitial ? Date.now() : undefined,
	});
}

export function flatChatThreads(
	data: InfiniteData<ChatsPage, number> | undefined,
) {
	if (!data) {
		return [] as ChatThreadListItem[];
	}
	const seen = new Set<string>();
	const threads: ChatThreadListItem[] = [];
	for (const page of data.pages) {
		for (const thread of page.threads) {
			if (seen.has(thread.id)) {
				continue;
			}
			seen.add(thread.id);
			threads.push(thread);
		}
	}
	return threads;
}

function findThreadInPages(
	data: InfiniteData<ChatsPage, number>,
	id: string,
) {
	for (const page of data.pages) {
		const thread = page.threads.find((item) => item.id === id);
		if (thread) {
			return thread;
		}
	}
	return null;
}

export function getCachedThreadTitle(queryClient: QueryClient, id: string) {
	const detail = queryClient.getQueryData<ChatThreadDetail>(
		chatsKeys.detail(id),
	);
	if (detail?.title?.trim()) {
		return detail.title.trim();
	}

	const list = queryClient.getQueryData<InfiniteData<ChatsPage, number>>(
		chatsKeys.list(),
	);
	const fromList = list ? findThreadInPages(list, id) : null;
	return fromList?.title?.trim() || null;
}

export function setChatThreadDetail(
	queryClient: QueryClient,
	thread: ChatThreadDetail,
) {
	queryClient.setQueryData(chatsKeys.detail(thread.id), thread);
}

export function prependChatThread(
	queryClient: QueryClient,
	thread: ChatThreadListItem,
) {
	setChatThreadDetail(queryClient, {
		id: thread.id,
		title: thread.title,
		updatedAt: thread.updatedAt,
	});

	queryClient.setQueryData<InfiniteData<ChatsPage, number>>(
		chatsKeys.list(),
		(old) => {
			if (!old) {
				return chatsInfiniteInitialData([thread], false);
			}

			if (findThreadInPages(old, thread.id)) {
				return bumpChatThread(old, thread.id, thread);
			}

			const [first, ...rest] = old.pages;
			if (!first) {
				return chatsInfiniteInitialData([thread], false);
			}

			return {
				...old,
				pages: [
					{
						...first,
						threads: [thread, ...first.threads],
						total: first.total + 1,
					},
					...rest,
				],
			};
		},
	);
}

function bumpChatThread(
	old: InfiniteData<ChatsPage, number>,
	id: string,
	patch: Partial<ChatThreadListItem>,
): InfiniteData<ChatsPage, number> {
	let matched: ChatThreadListItem | null = null;
	const pagesWithout = old.pages.map((page) => ({
		...page,
		threads: page.threads.filter((thread) => {
			if (thread.id !== id) {
				return true;
			}
			matched = { ...thread, ...patch };
			return false;
		}),
	}));

	if (!matched) {
		return old;
	}

	const [first, ...rest] = pagesWithout;
	if (!first) {
		return old;
	}

	return {
		...old,
		pages: [
			{
				...first,
				threads: [matched, ...first.threads],
			},
			...rest,
		],
	};
}

export function touchChatThread(
	queryClient: QueryClient,
	id: string,
	patch: Partial<ChatThreadListItem> = {},
) {
	const nextPatch = {
		...patch,
		updatedAt: patch.updatedAt ?? new Date().toISOString(),
	};

	queryClient.setQueryData<ChatThreadDetail>(chatsKeys.detail(id), (old) => {
		if (!old && !patch.title) {
			return old;
		}
		return {
			id,
			title: patch.title ?? old?.title ?? "New chat",
			updatedAt: nextPatch.updatedAt!,
		};
	});

	queryClient.setQueryData<InfiniteData<ChatsPage, number>>(
		chatsKeys.list(),
		(old) => {
			if (!old) {
				if (!patch.title) {
					return old;
				}
				return chatsInfiniteInitialData(
					[
						{
							id,
							title: patch.title,
							preview: patch.preview ?? "",
							updatedAt: nextPatch.updatedAt!,
						},
					],
					false,
				);
			}
			if (!findThreadInPages(old, id)) {
				return old;
			}
			return bumpChatThread(old, id, nextPatch);
		},
	);
}

export function renameThreadInCache(
	queryClient: QueryClient,
	id: string,
	title: string,
) {
	queryClient.setQueryData<ChatThreadDetail>(chatsKeys.detail(id), (old) =>
		old ? { ...old, title } : old,
	);

	queryClient.setQueryData<InfiniteData<ChatsPage, number>>(
		chatsKeys.list(),
		(old) => {
			if (!old) {
				return old;
			}
			return {
				...old,
				pages: old.pages.map((page) => ({
					...page,
					threads: page.threads.map((thread) =>
						thread.id === id ? { ...thread, title } : thread,
					),
				})),
			};
		},
	);
}

export function removeThreadFromCache(queryClient: QueryClient, id: string) {
	queryClient.removeQueries({ queryKey: chatsKeys.detail(id) });

	queryClient.setQueryData<InfiniteData<ChatsPage, number>>(
		chatsKeys.list(),
		(old) => {
			if (!old) {
				return old;
			}
			return {
				...old,
				pages: old.pages.map((page) => {
					const hadThread = page.threads.some(
						(thread) => thread.id === id,
					);
					return {
						...page,
						threads: page.threads.filter((thread) => thread.id !== id),
						total: hadThread ? Math.max(0, page.total - 1) : page.total,
					};
				}),
			};
		},
	);
}

export function invalidateChatThreads(queryClient: QueryClient) {
	return queryClient.invalidateQueries({ queryKey: chatsKeys.all });
}

export function refreshChatAfterTurn(
	queryClient: QueryClient,
	threadId: string,
) {
	const title = getCachedThreadTitle(queryClient, threadId);
	const needsTitle =
		!title || title === "New chat";

	if (!needsTitle) {
		return [];
	}

	const delays = [800, 2500];
	return delays.map((ms) =>
		window.setTimeout(() => {
			const current = getCachedThreadTitle(queryClient, threadId);
			if (current && current !== "New chat") {
				return;
			}
			void queryClient.invalidateQueries({
				queryKey: chatsKeys.list(),
			});
			void queryClient.invalidateQueries({
				queryKey: chatsKeys.detail(threadId),
			});
		}, ms),
	);
}
