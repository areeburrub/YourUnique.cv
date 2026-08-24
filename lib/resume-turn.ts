const TURN_RESUME_ID_KEY = "turnResumeId";
const REQUEST_ID_KEY = "requestId";
const TURN_TTL_MS = 10 * 60 * 1000;

type ResumeTurnState = {
	resumeId: string | null;
	tail: Promise<unknown>;
};

type RequestContextLike = {
	get: (key: string) => unknown;
	set?: (key: string, value: unknown) => void;
};

const turns = new Map<string, ResumeTurnState>();
const turnTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function resumeTurnIdKey() {
	return TURN_RESUME_ID_KEY;
}

export function resumeRequestIdKey() {
	return REQUEST_ID_KEY;
}

function turnKey(requestContext: RequestContextLike | undefined) {
	const requestId = requestContext?.get(REQUEST_ID_KEY);
	if (typeof requestId === "string" && requestId) {
		return `request:${requestId}`;
	}
	const userId = requestContext?.get("userId");
	const threadId = requestContext?.get("threadId");
	if (typeof userId === "string" && userId) {
		return `fallback:${userId}:${typeof threadId === "string" ? threadId : ""}`;
	}
	return null;
}

function getTurnState(key: string) {
	let state = turns.get(key);
	if (!state) {
		state = { resumeId: null, tail: Promise.resolve() };
		turns.set(key, state);
	}
	const previous = turnTimers.get(key);
	if (previous) {
		clearTimeout(previous);
	}
	turnTimers.set(
		key,
		setTimeout(() => {
			turns.delete(key);
			turnTimers.delete(key);
		}, TURN_TTL_MS),
	);
	return state;
}

export function getTurnResumeId(
	requestContext: RequestContextLike | undefined,
) {
	const fromContext = requestContext?.get(TURN_RESUME_ID_KEY);
	if (typeof fromContext === "string" && fromContext) {
		return fromContext;
	}
	const key = turnKey(requestContext);
	if (!key) {
		return null;
	}
	return getTurnState(key).resumeId;
}

export function setTurnResumeId(
	requestContext: RequestContextLike | undefined,
	id: string,
) {
	requestContext?.set?.(TURN_RESUME_ID_KEY, id);
	const key = turnKey(requestContext);
	if (!key) {
		return;
	}
	getTurnState(key).resumeId = id;
}

export async function withResumeTurnLock<T>(
	requestContext: RequestContextLike | undefined,
	fn: () => Promise<T>,
) {
	const key = turnKey(requestContext);
	if (!key) {
		return fn();
	}
	const state = getTurnState(key);
	const run = state.tail.then(fn, fn);
	state.tail = run.then(
		() => undefined,
		() => undefined,
	);
	return run;
}
