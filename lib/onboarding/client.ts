import { uploadChatFile, type UploadProgress } from "@/lib/client-uploads";
import {
	clearPendingResume,
	pendingResumeToFile,
	savePendingResume,
	takePendingResume,
} from "@/lib/pending-resume";
import {
	MAX_UPLOAD_BYTES,
	isAllowedOnboardingUploadMediaType,
	mediaTypeFromFilename,
	resolveUploadMediaType,
} from "@/lib/uploads";

export type OnboardingProgress = {
	onboarded: boolean;
	complete: boolean;
	nextStep?: string;
};

let consumePendingPromise: Promise<{
	id: string;
	filename: string;
	mediaType: string;
} | null> | null = null;

export async function saveOnboardingProgress(body: Record<string, unknown>) {
	const response = await fetch("/api/onboarding/progress", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	const data = (await response.json().catch(() => null)) as {
		error?: string;
	} | null;
	if (!response.ok) {
		throw new Error(data?.error || "Could not save onboarding progress");
	}
}

export async function fetchOnboardingProgress() {
	const response = await fetch("/api/onboarding/progress");
	if (response.status === 401) {
		return null;
	}
	if (!response.ok) {
		throw new Error("Could not load onboarding status");
	}
	return (await response.json()) as OnboardingProgress;
}

export function resolveOnboardingResume(file: File) {
	const mediaType =
		resolveUploadMediaType({
			filename: file.name,
			mediaType: file.type || mediaTypeFromFilename(file.name),
		}) || file.type;

	if (!isAllowedOnboardingUploadMediaType(mediaType)) {
		throw new Error("Please upload a PDF, DOCX, image, or text resume.");
	}
	if (file.size > MAX_UPLOAD_BYTES) {
		throw new Error("Resume must be 10MB or smaller.");
	}

	return mediaType;
}

export async function uploadOnboardingResume(
	file: File,
	onProgress?: (progress: UploadProgress) => void,
) {
	const mediaType = resolveOnboardingResume(file);
	const objectUrl = URL.createObjectURL(file);
	try {
		return await uploadChatFile({
			file: {
				type: "file",
				filename: file.name,
				mediaType,
				url: objectUrl,
			},
			onProgress,
		});
	} finally {
		URL.revokeObjectURL(objectUrl);
	}
}

export async function consumePendingOnboardingResume(
	onProgress?: (progress: UploadProgress) => void,
) {
	if (!consumePendingPromise) {
		consumePendingPromise = (async () => {
			const pending = await takePendingResume();
			if (!pending) {
				return null;
			}

			try {
				const file = pendingResumeToFile(pending);
				const uploaded = await uploadOnboardingResume(file, onProgress);
				await saveOnboardingProgress({
					step: "resume",
					resumeFileId: uploaded.id,
				});
				return uploaded;
			} catch (error) {
				consumePendingPromise = null;
				await savePendingResume(pendingResumeToFile(pending)).catch(
					() => undefined,
				);
				throw error;
			}
		})();
	}

	return consumePendingPromise;
}

export async function discardPendingResume() {
	await clearPendingResume().catch(() => undefined);
}
