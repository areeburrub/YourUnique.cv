const DONE_KEY = "yourunique:peerlist-upvote-done";
const SNOOZE_UNTIL_KEY = "yourunique:peerlist-upvote-snooze-until";
const GENERATED_THIS_SESSION_KEY = "yourunique:ph-resume-this-session";

export const PEERLIST_SNOOZE_MS = 2 * 60 * 60 * 1000;
export const PEERLIST_PROMPT_ENABLED = false;

function canUseStorage() {
	return typeof window !== "undefined";
}

function readItem(key: string) {
	if (!canUseStorage()) {
		return null;
	}
	try {
		return window.localStorage.getItem(key);
	} catch {
		return null;
	}
}

function writeItem(key: string, value: string) {
	if (!canUseStorage()) {
		return;
	}
	try {
		window.localStorage.setItem(key, value);
	} catch {
		return;
	}
}

function removeItem(key: string) {
	if (!canUseStorage()) {
		return;
	}
	try {
		window.localStorage.removeItem(key);
	} catch {
		return;
	}
}

export function markResumeGeneratedThisSession() {
	if (!canUseStorage()) {
		return;
	}
	try {
		sessionStorage.setItem(GENERATED_THIS_SESSION_KEY, "1");
	} catch {
		return;
	}
}

export function wasResumeGeneratedThisSession() {
	if (!canUseStorage()) {
		return false;
	}
	try {
		return sessionStorage.getItem(GENERATED_THIS_SESSION_KEY) === "1";
	} catch {
		return false;
	}
}

export function completePeerlistUpvote() {
	writeItem(DONE_KEY, "1");
	removeItem(SNOOZE_UNTIL_KEY);
}

export function snoozePeerlistUpvote(durationMs = PEERLIST_SNOOZE_MS) {
	writeItem(SNOOZE_UNTIL_KEY, String(Date.now() + durationMs));
}

export function peerlistSnoozeRemainingMs() {
	if (readItem(DONE_KEY) === "1") {
		return 0;
	}
	const raw = readItem(SNOOZE_UNTIL_KEY);
	if (!raw) {
		return 0;
	}
	const until = Number(raw);
	if (!Number.isFinite(until)) {
		return 0;
	}
	return Math.max(0, until - Date.now());
}

export function shouldShowPeerlistUpvote(hasReadyResume: boolean) {
	if (!PEERLIST_PROMPT_ENABLED) {
		return false;
	}
	if (!hasReadyResume) {
		return false;
	}
	if (readItem(DONE_KEY) === "1") {
		return false;
	}
	if (wasResumeGeneratedThisSession()) {
		return false;
	}
	return peerlistSnoozeRemainingMs() === 0;
}
