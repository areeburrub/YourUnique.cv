const DB_NAME = "yourunique.cv";
const DB_VERSION = 1;
const STORE = "pending-resume";
const RECORD_KEY = "landing";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type PendingResume = {
	filename: string;
	mediaType: string;
	blob: Blob;
	savedAt: number;
};

function canUseIndexedDb() {
	return typeof indexedDB !== "undefined";
}

function openDb() {
	if (!canUseIndexedDb()) {
		return Promise.reject(new Error("IndexedDB is not available"));
	}

	return new Promise<IDBDatabase>((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(STORE)) {
				db.createObjectStore(STORE);
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () =>
			reject(request.error ?? new Error("Could not open IndexedDB"));
	});
}

function isFreshRecord(value: unknown): value is PendingResume {
	if (!value || typeof value !== "object") {
		return false;
	}
	const record = value as PendingResume;
	return (
		typeof record.filename === "string" &&
		typeof record.mediaType === "string" &&
		typeof record.savedAt === "number" &&
		record.blob instanceof Blob &&
		Date.now() - record.savedAt <= MAX_AGE_MS
	);
}

export function pendingResumeToFile(record: PendingResume) {
	return new File([record.blob], record.filename, {
		type: record.mediaType,
	});
}

export async function savePendingResume(file: File) {
	const db = await openDb();
	const record: PendingResume = {
		filename: file.name,
		mediaType: file.type,
		blob: file,
		savedAt: Date.now(),
	};

	try {
		await new Promise<void>((resolve, reject) => {
			const tx = db.transaction(STORE, "readwrite");
			tx.objectStore(STORE).put(record, RECORD_KEY);
			tx.oncomplete = () => resolve();
			tx.onerror = () =>
				reject(tx.error ?? new Error("Could not save resume locally"));
		});
	} finally {
		db.close();
	}
}

export async function clearPendingResume() {
	if (!canUseIndexedDb()) {
		return;
	}

	const db = await openDb();
	try {
		await new Promise<void>((resolve, reject) => {
			const tx = db.transaction(STORE, "readwrite");
			tx.objectStore(STORE).delete(RECORD_KEY);
			tx.oncomplete = () => resolve();
			tx.onerror = () =>
				reject(tx.error ?? new Error("Could not clear local resume"));
		});
	} finally {
		db.close();
	}
}

export async function takePendingResume() {
	if (!canUseIndexedDb()) {
		return null;
	}

	const db = await openDb();
	try {
		return await new Promise<PendingResume | null>((resolve, reject) => {
			const tx = db.transaction(STORE, "readwrite");
			const store = tx.objectStore(STORE);
			const request = store.get(RECORD_KEY);
			request.onsuccess = () => {
				const record = request.result;
				store.delete(RECORD_KEY);
				resolve(isFreshRecord(record) ? record : null);
			};
			request.onerror = () =>
				reject(request.error ?? new Error("Could not read local resume"));
		});
	} finally {
		db.close();
	}
}
