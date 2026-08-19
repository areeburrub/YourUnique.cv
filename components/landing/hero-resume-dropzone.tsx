"use client";

import { useAuth } from "@clerk/nextjs";
import { FileArrowUpIcon } from "@phosphor-icons/react";
import { useRef, useState } from "react";

import { Spinner } from "@/components/ui/spinner";
import { dataTransferHasFiles } from "@/lib/file-drag";
import {
	discardPendingResume,
	fetchOnboardingProgress,
	resolveOnboardingResume,
	saveOnboardingProgress,
	uploadOnboardingResume,
} from "@/lib/onboarding/client";
import { MixpanelEvent, trackEvent } from "@/lib/mixpanel";
import { savePendingResume } from "@/lib/pending-resume";
import { ONBOARDING_UPLOAD_ACCEPT } from "@/lib/uploads";
import { cn } from "@/lib/utils";

type DropStatus = "idle" | "saving" | "uploading" | "opening";

export function HeroResumeDropzone() {
	const { isLoaded, isSignedIn } = useAuth();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const dragDepth = useRef(0);
	const [dragging, setDragging] = useState(false);
	const [status, setStatus] = useState<DropStatus>("idle");
	const [error, setError] = useState<string | null>(null);

	const busy = status !== "idle";

	function resetDrag() {
		dragDepth.current = 0;
		setDragging(false);
	}

	async function handleFile(file: File) {
		if (busy || !isLoaded) {
			return;
		}

		setError(null);

		try {
			const mediaType = resolveOnboardingResume(file);
			const resume = file.type
				? file
				: new File([file], file.name, { type: mediaType });

			if (!isSignedIn) {
				setStatus("saving");
				await savePendingResume(resume);
				trackEvent(
					MixpanelEvent.LandingResumeUploaded,
					{
						signed_in: false,
						destination: "sign-up",
					},
					{ sendImmediately: true },
				);
				window.location.href = "/sign-up";
				return;
			}

			const progress = await fetchOnboardingProgress();
			if (progress?.onboarded) {
				setStatus("opening");
				await discardPendingResume();
				trackEvent(
					MixpanelEvent.LandingResumeUploaded,
					{
						signed_in: true,
						destination: "new-chat",
					},
					{ sendImmediately: true },
				);
				window.location.href = "/new-chat";
				return;
			}

			setStatus("uploading");
			const uploaded = await uploadOnboardingResume(resume);
			await saveOnboardingProgress({
				step: "resume",
				resumeFileId: uploaded.id,
			});
			await discardPendingResume();
			trackEvent(
				MixpanelEvent.LandingResumeUploaded,
				{
					signed_in: true,
					destination: "onboarding",
				},
				{ sendImmediately: true },
			);
			window.location.href = "/onboarding";
		} catch (err) {
			setStatus("idle");
			setError(
				err instanceof Error ? err.message : "Could not use that resume",
			);
		}
	}

	const label =
		status === "saving"
			? "Saving your resume…"
			: status === "uploading"
				? "Uploading your resume…"
				: status === "opening"
					? "Opening a new chat…"
					: dragging
						? "Drop your resume"
						: "Upload your resume";

	return (
		<div className="flex w-full max-w-[400px] flex-col items-start">
			<input
				ref={fileInputRef}
				type="file"
				accept={ONBOARDING_UPLOAD_ACCEPT}
				className="sr-only"
				onChange={(event) => {
					const file = event.target.files?.[0];
					event.target.value = "";
					if (file) {
						void handleFile(file);
					}
				}}
			/>
			<button
				type="button"
				disabled={busy || !isLoaded}
				onClick={() => fileInputRef.current?.click()}
				onDragEnter={(event) => {
					if (!dataTransferHasFiles(event.dataTransfer)) {
						return;
					}
					event.preventDefault();
					dragDepth.current += 1;
					setDragging(true);
				}}
				onDragOver={(event) => {
					if (!dataTransferHasFiles(event.dataTransfer)) {
						return;
					}
					event.preventDefault();
					event.dataTransfer.dropEffect = "copy";
				}}
				onDragLeave={(event) => {
					if (!dataTransferHasFiles(event.dataTransfer)) {
						return;
					}
					dragDepth.current = Math.max(0, dragDepth.current - 1);
					if (dragDepth.current === 0) {
						setDragging(false);
					}
				}}
				onDrop={(event) => {
					const file = event.dataTransfer.files?.[0];
					event.preventDefault();
					resetDrag();
					if (file) {
						void handleFile(file);
					}
				}}
				className={cn(
					"inline-flex h-12 items-center justify-center gap-2.5 rounded-full border px-7 text-base font-medium transition-all duration-200 hover:-translate-y-px disabled:pointer-events-none disabled:opacity-60",
					dragging
						? "border-brand bg-brand/90 text-brand-foreground"
						: "border-brand bg-brand text-brand-foreground hover:bg-brand/90",
				)}
			>
				{busy ? (
					<Spinner className="size-4 text-current" />
				) : (
					<FileArrowUpIcon size={18} weight="bold" />
				)}
				{label}
			</button>
			<p className="mt-3 text-sm text-muted-foreground">
				PDF · drop a file to start
			</p>
			{error ? (
				<p className="mt-2 text-sm text-destructive">{error}</p>
			) : null}
		</div>
	);
}
