const DONE_KEY = "yourunique:ph-upvote-done";
const SNOOZE_UNTIL_KEY = "yourunique:ph-upvote-snooze-until";
const LEGACY_DISMISSED_KEY = "yourunique:ph-upvote-dismissed";
const GENERATED_THIS_SESSION_KEY = "yourunique:ph-resume-this-session";

export const PRODUCT_HUNT_SNOOZE_MS = 2 * 60 * 60 * 1000;

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

export function completeProductHuntUpvote() {
	writeItem(DONE_KEY, "1");
	removeItem(SNOOZE_UNTIL_KEY);
	removeItem(LEGACY_DISMISSED_KEY);
}

export function snoozeProductHuntUpvote(durationMs = PRODUCT_HUNT_SNOOZE_MS) {
	writeItem(SNOOZE_UNTIL_KEY, String(Date.now() + durationMs));
}

export function productHuntSnoozeRemainingMs() {
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

export function shouldShowProductHuntUpvote(hasReadyResume: boolean) {
	if (!hasReadyResume) {
		return false;
	}
	if (readItem(DONE_KEY) === "1") {
		return false;
	}
	if (wasResumeGeneratedThisSession()) {
		return false;
	}
	return productHuntSnoozeRemainingMs() === 0;
}
