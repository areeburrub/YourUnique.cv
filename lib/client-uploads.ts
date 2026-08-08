import type { FileUIPart } from "ai";

export type UploadedFile = {
	id: string;
	filename: string;
	mediaType: string;
	size: number;
	url: string;
};

export type UploadProgress = {
	phase: "presign" | "put" | "complete";
	percent: number;
};

type PresignResponse = {
	id: string;
	key: string;
	uploadUrl: string;
	filename: string;
	mediaType: string;
	size: number;
	url: string;
	threadId: string | null;
	error?: string;
};

function putWithProgress(input: {
	url: string;
	body: Blob;
	contentType: string;
	onProgress?: (percent: number) => void;
}) {
	return new Promise<void>((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("PUT", input.url);
		xhr.setRequestHeader("Content-Type", input.contentType);

		xhr.upload.onprogress = (event) => {
			if (!event.lengthComputable || !input.onProgress) {
				return;
			}
			input.onProgress(Math.round((event.loaded / event.total) * 100));
		};

		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve();
				return;
			}
			reject(new Error(`Failed to upload to storage (${xhr.status})`));
		};

		xhr.onerror = () => {
			reject(new Error("Failed to upload to storage"));
		};

		xhr.send(input.body);
	});
}

export async function uploadChatFile(input: {
	file: FileUIPart;
	threadId?: string;
	onProgress?: (progress: UploadProgress) => void;
}): Promise<UploadedFile> {
	input.onProgress?.({ phase: "presign", percent: 0 });

	const response = await fetch(input.file.url);
	if (!response.ok) {
		throw new Error(
			`Failed to read attachment: ${input.file.filename || "file"}`,
		);
	}

	const blob = await response.blob();
	const contentType =
		input.file.mediaType || blob.type || "application/octet-stream";
	const filename = input.file.filename || "file";

	const presignResponse = await fetch("/api/uploads/presign", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			filename,
			contentType,
			size: blob.size,
			threadId: input.threadId,
		}),
	});

	const presign = (await presignResponse.json().catch(() => null)) as
		| PresignResponse
		| null;

	if (!presignResponse.ok || !presign?.uploadUrl) {
		throw new Error(presign?.error || "Failed to prepare file upload");
	}

	input.onProgress?.({ phase: "put", percent: 5 });

	await putWithProgress({
		url: presign.uploadUrl,
		body: blob,
		contentType: presign.mediaType,
		onProgress: (percent) => {
			input.onProgress?.({
				phase: "put",
				percent: Math.max(5, Math.min(95, percent)),
			});
		},
	});

	input.onProgress?.({ phase: "complete", percent: 96 });

	const completeResponse = await fetch("/api/uploads/complete", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			id: presign.id,
			key: presign.key,
			filename: presign.filename,
			contentType: presign.mediaType,
			size: presign.size,
			threadId: input.threadId,
		}),
	});

	const complete = (await completeResponse.json().catch(() => null)) as {
		file?: UploadedFile;
		error?: string;
	} | null;

	if (!completeResponse.ok || !complete?.file) {
		throw new Error(complete?.error || "Failed to finalize file upload");
	}

	input.onProgress?.({ phase: "complete", percent: 100 });
	return complete.file;
}

export function toFileUIParts(files: UploadedFile[]): FileUIPart[] {
	return files.map((file) => ({
		type: "file" as const,
		filename: file.filename,
		mediaType: file.mediaType,
		url: file.url,
	}));
}
