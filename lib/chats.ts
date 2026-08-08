export type ChatThreadListItem = {
	id: string;
	title: string;
	preview: string;
	updatedAt: string;
	messageCount?: number;
};

export function getChatThreadHref(id: string) {
	return `/chats/${id}`;
}
