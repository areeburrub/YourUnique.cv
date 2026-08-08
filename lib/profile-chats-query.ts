"use client";

import {
	type InfiniteData,
	type QueryClient,
	useInfiniteQuery,
} from "@tanstack/react-query";

import type { ChatThreadListItem } from "@/lib/chats";
import { CHATS_PAGE_SIZE } from "@/lib/chats";
import {
	type ChatThreadDetail,
	type ChatsPage,
	chatsInfiniteInitialData,
} from "@/lib/chats-query";

export const profileChatsKeys = {
	all: ["profile-chats"] as const,
	list: () => [...profileChatsKeys.all, "list"] as const,
	detail: (id: string) => [...profileChatsKeys.all, "detail", id] as const,
};

export async function fetchProfileChatsPage(page: number): Promise<ChatsPage> {
	const response = await fetch(
		`/api/profile/chats?page=${page}&limit=${CHATS_PAGE_SIZE}`,
	);
	if (!response.ok) {
		throw new Error("Failed to load profile chats");
	}
	return response.json() as Promise<ChatsPage>;
}

export async function renameProfileChatThreadRequest(
	id: string,
	title: string,
): Promise<ChatThreadDetail> {
	const response = await fetch(`/api/profile/chats/${id}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ title }),
	});
	if (!response.ok) {
		throw new Error("Failed to rename chat");
	}
	return response.json() as Promise<ChatThreadDetail>;
}

export async function deleteProfileChatThreadRequest(
	id: string,
): Promise<void> {
	const response = await fetch(`/api/profile/chats/${id}`, {
		method: "DELETE",
	});
	if (!response.ok) {
		throw new Error("Failed to delete chat");
	}
}

export function useProfileChatThreadsInfinite(options?: {
	enabled?: boolean;
	initialThreads?: ChatThreadListItem[];
	initialHasMore?: boolean;
}) {
	const enabled = options?.enabled ?? true;
	const hasInitial = Boolean(options?.initialThreads);

	return useInfiniteQuery<
		ChatsPage,
		Error,
		InfiniteData<ChatsPage, number>,
		ReturnType<typeof profileChatsKeys.list>,
		number
	>({
		queryKey: profileChatsKeys.list(),
		queryFn: ({ pageParam }) => fetchProfileChatsPage(pageParam),
		initialPageParam: 0,
		getNextPageParam: (lastPage) =>
			lastPage.hasMore ? lastPage.page + 1 : undefined,
		enabled,
		initialData:
			enabled && hasInitial
				? chatsInfiniteInitialData(
						options?.initialThreads ?? [],
						options?.initialHasMore ?? false,
					)
				: undefined,
		initialDataUpdatedAt: enabled && hasInitial ? Date.now() : undefined,
	});
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

export function prependProfileChatThread(
	queryClient: QueryClient,
	thread: ChatThreadListItem,
) {
	queryClient.setQueryData(profileChatsKeys.detail(thread.id), {
		id: thread.id,
		title: thread.title,
		updatedAt: thread.updatedAt,
	});

	queryClient.setQueryData<InfiniteData<ChatsPage, number>>(
		profileChatsKeys.list(),
		(old) => {
			if (!old) {
				return chatsInfiniteInitialData([thread], false);
			}
			if (findThreadInPages(old, thread.id)) {
				return old;
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

export function touchProfileChatThread(
	queryClient: QueryClient,
	id: string,
	patch: Partial<ChatThreadListItem> = {},
) {
	const nextPatch = {
		...patch,
		updatedAt: patch.updatedAt ?? new Date().toISOString(),
	};

	queryClient.setQueryData<ChatThreadDetail>(
		profileChatsKeys.detail(id),
		(old) => {
			if (!old && !patch.title) {
				return old;
			}
			return {
				id,
				title: patch.title ?? old?.title ?? "New chat",
				updatedAt: nextPatch.updatedAt!,
			};
		},
	);

	queryClient.setQueryData<InfiniteData<ChatsPage, number>>(
		profileChatsKeys.list(),
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

			let matched: ChatThreadListItem | null = null;
			const pagesWithout = old.pages.map((page) => ({
				...page,
				threads: page.threads.filter((thread) => {
					if (thread.id !== id) {
						return true;
					}
					matched = { ...thread, ...nextPatch };
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
		},
	);
}

export function renameProfileThreadInCache(
	queryClient: QueryClient,
	id: string,
	title: string,
) {
	queryClient.setQueryData<ChatThreadDetail>(
		profileChatsKeys.detail(id),
		(old) => (old ? { ...old, title } : old),
	);

	queryClient.setQueryData<InfiniteData<ChatsPage, number>>(
		profileChatsKeys.list(),
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

export function removeProfileThreadFromCache(
	queryClient: QueryClient,
	id: string,
) {
	queryClient.removeQueries({ queryKey: profileChatsKeys.detail(id) });

	queryClient.setQueryData<InfiniteData<ChatsPage, number>>(
		profileChatsKeys.list(),
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

export function refreshProfileChatAfterTurn(
	queryClient: QueryClient,
	threadId: string,
) {
	const delays = [800, 2500];
	return delays.map((ms) =>
		window.setTimeout(() => {
			void queryClient.invalidateQueries({
				queryKey: profileChatsKeys.list(),
			});
			void queryClient.invalidateQueries({
				queryKey: profileChatsKeys.detail(threadId),
			});
		}, ms),
	);
}
