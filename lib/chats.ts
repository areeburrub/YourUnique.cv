export type ChatThreadListItem = {
	id: string;
	title: string;
	preview: string;
	updatedAt: string;
	messageCount?: number;
};

export const CHATS_PAGE_SIZE = 20;

export function getChatThreadHref(id: string) {
	return `/chats/${id}`;
}
