export type ChatThreadListItem = {
	id: string;
	title: string;
	preview: string;
	updatedAt: string;
	messageCount?: number;
	kind?: "chat" | "profile";
};

export const CHATS_PAGE_SIZE = 20;

export function getChatThreadHref(id: string) {
	return `/chats/${id}`;
}

export function getProfileChatThreadHref(id: string) {
	return `/profile/${id}`;
}

export function getThreadHref(thread: Pick<ChatThreadListItem, "id" | "kind">) {
	return thread.kind === "profile"
		? getProfileChatThreadHref(thread.id)
		: getChatThreadHref(thread.id);
}
