import type { FileUIPart } from "ai";

export type UploadedFile = {
	id: string;
	filename: string;
	mediaType: string;
	size: number;
	url: string;
};

export async function uploadChatFiles(input: {
	files: FileUIPart[];
	threadId?: string;
}): Promise<UploadedFile[]> {
	if (input.files.length === 0) {
		return [];
	}

	const formData = new FormData();
	if (input.threadId) {
		formData.append("threadId", input.threadId);
	}

	for (const file of input.files) {
		const response = await fetch(file.url);
		const blob = await response.blob();
		formData.append(
			"files",
			new File([blob], file.filename || "file", {
				type: file.mediaType || blob.type || "application/octet-stream",
			}),
		);
	}

	const uploadResponse = await fetch("/api/uploads", {
		method: "POST",
		body: formData,
	});

	if (!uploadResponse.ok) {
		const data = (await uploadResponse.json().catch(() => null)) as {
			error?: string;
		} | null;
		throw new Error(data?.error || "Failed to upload files");
	}

	const data = (await uploadResponse.json()) as { files: UploadedFile[] };
	return data.files;
}

export function toFileUIParts(files: UploadedFile[]): FileUIPart[] {
	return files.map((file) => ({
		type: "file" as const,
		filename: file.filename,
		mediaType: file.mediaType,
		url: file.url,
	}));
}
