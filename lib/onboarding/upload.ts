import {
	uploadChatFile,
	type UploadedFile,
	type UploadProgress,
} from "@/lib/client-uploads";
import {
	isAllowedOnboardingUploadMediaType,
	resolveUploadMediaType,
} from "@/lib/uploads";

export async function uploadOnboardingFile(input: {
	file: File;
	onProgress?: (progress: UploadProgress) => void;
}): Promise<UploadedFile> {
	const mediaType = resolveUploadMediaType({
		filename: input.file.name,
		mediaType: input.file.type,
	});

	if (!mediaType || !isAllowedOnboardingUploadMediaType(mediaType)) {
		throw new Error(
			`Unsupported file type for onboarding: ${input.file.name}`,
		);
	}

	const objectUrl = URL.createObjectURL(input.file);
	try {
		return await uploadChatFile({
			file: {
				type: "file",
				filename: input.file.name,
				mediaType,
				url: objectUrl,
			},
			onProgress: input.onProgress,
		});
	} finally {
		URL.revokeObjectURL(objectUrl);
	}
}
