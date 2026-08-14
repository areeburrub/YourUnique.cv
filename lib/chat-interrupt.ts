function storageKey(threadId: string) {
	return `yourunique:chat-in-flight:${threadId}`;
}

function canUseStorage() {
	return typeof window !== "undefined";
}

export function markChatTurnInFlight(threadId: string) {
	if (!canUseStorage() || !threadId) {
		return;
	}
	sessionStorage.setItem(storageKey(threadId), "1");
}

export function clearChatTurnInFlight(threadId: string) {
	if (!canUseStorage() || !threadId) {
		return;
	}
	sessionStorage.removeItem(storageKey(threadId));
}

export function wasChatTurnInterrupted(threadId: string) {
	if (!canUseStorage() || !threadId) {
		return false;
	}
	return sessionStorage.getItem(storageKey(threadId)) === "1";
}
