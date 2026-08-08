import { ChatHeader } from "../chats/[id]/_components/chat-header";
import { ChatView } from "../chats/[id]/_components/chat-view";

export default function NewChatPage() {
	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<ChatHeader title="New chat" />
			<ChatView />
		</div>
	);
}
