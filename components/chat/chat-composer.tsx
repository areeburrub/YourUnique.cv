"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { ChatStatus, FileUIPart } from "ai";
import { PaperclipIcon, XIcon } from "@phosphor-icons/react";

import {
	PromptInput,
	PromptInputBody,
	PromptInputFooter,
	type PromptInputMessage,
	PromptInputHeader,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputTools,
	usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { SpeechToTextButton } from "@/components/chat/speech-to-text-button";
import { dataTransferHasFiles } from "@/lib/file-drag";
import { fileTypeLabel } from "@/lib/file-type";
import {
	MAX_UPLOAD_BYTES,
	MAX_UPLOAD_FILES,
	UPLOAD_ACCEPT,
} from "@/lib/uploads";

export type AttachmentUploadState = {
	status: "uploading" | "ready" | "error";
	progress: number;
	error?: string;
};

type ChatComposerProps = {
	text: string;
	onTextChange: (value: string) => void;
	onSubmit: (message: PromptInputMessage) => void | Promise<void>;
	onError: (message: string) => void;
	onLocalFilesChange: (files: Array<FileUIPart & { id: string }>) => void;
	onDragStateChange?: (dragging: boolean) => void;
	onStop: () => void;
	status: ChatStatus;
	uploads: Record<string, AttachmentUploadState>;
	busy: boolean;
	canSubmit: boolean;
	disabled?: boolean;
	errorMessage?: string | null;
	above?: ReactNode;
	variant?: "docked" | "centered";
	accept?: string;
	maxFiles?: number;
	placeholder?: string;
};

function LocalFilesSync({
	onChange,
}: {
	onChange: (files: Array<FileUIPart & { id: string }>) => void;
}) {
	const attachments = usePromptInputAttachments();
	const lastIdsRef = useRef<string>("");

	useEffect(() => {
		const ids = attachments.files.map((file) => file.id).join("\0");
		if (ids === lastIdsRef.current) {
			return;
		}
		lastIdsRef.current = ids;
		onChange(attachments.files);
	}, [attachments.files, onChange]);

	return null;
}

function GlobalFileDrop({
	onDragStateChange,
}: {
	onDragStateChange?: (dragging: boolean) => void;
}) {
	const { add } = usePromptInputAttachments();
	const dragDepth = useRef(0);

	useEffect(() => {
		const reset = () => {
			dragDepth.current = 0;
			onDragStateChange?.(false);
		};

		const onDragEnter = (event: DragEvent) => {
			if (!dataTransferHasFiles(event.dataTransfer)) {
				return;
			}
			event.preventDefault();
			dragDepth.current += 1;
			onDragStateChange?.(true);
		};

		const onDragOver = (event: DragEvent) => {
			if (!dataTransferHasFiles(event.dataTransfer)) {
				return;
			}
			event.preventDefault();
			if (event.dataTransfer) {
				event.dataTransfer.dropEffect = "copy";
			}
		};

		const onDragLeave = (event: DragEvent) => {
			if (!dataTransferHasFiles(event.dataTransfer)) {
				return;
			}
			dragDepth.current = Math.max(0, dragDepth.current - 1);
			if (dragDepth.current === 0) {
				onDragStateChange?.(false);
			}
		};

		const onDrop = (event: DragEvent) => {
			const files = event.dataTransfer?.files;
			const hasFiles =
				dataTransferHasFiles(event.dataTransfer) ||
				Boolean(files && files.length > 0);
			if (!hasFiles) {
				reset();
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			reset();
			if (files && files.length > 0) {
				add(files);
			}
		};

		const options = { capture: true } as const;
		document.addEventListener("dragenter", onDragEnter, options);
		document.addEventListener("dragover", onDragOver, options);
		document.addEventListener("dragleave", onDragLeave, options);
		document.addEventListener("drop", onDrop, options);
		window.addEventListener("dragend", reset);

		return () => {
			document.removeEventListener("dragenter", onDragEnter, options);
			document.removeEventListener("dragover", onDragOver, options);
			document.removeEventListener("dragleave", onDragLeave, options);
			document.removeEventListener("drop", onDrop, options);
			window.removeEventListener("dragend", reset);
		};
	}, [add, onDragStateChange]);

	return null;
}

function CircularProgress({
	value,
	label,
}: {
	value: number;
	label: string;
}) {
	const size = 36;
	const stroke = 2.5;
	const radius = (size - stroke) / 2;
	const circumference = 2 * Math.PI * radius;
	const clamped = Math.max(0, Math.min(100, value));
	const offset = circumference - (clamped / 100) * circumference;

	return (
		<div
			className="relative flex size-9 shrink-0 items-center justify-center"
			role="progressbar"
			aria-valuenow={clamped}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-label={label}
		>
			<svg width={size} height={size} className="-rotate-90">
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke="currentColor"
					strokeWidth={stroke}
					className="text-border"
				/>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke="currentColor"
					strokeWidth={stroke}
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					className="text-foreground transition-[stroke-dashoffset] duration-150"
				/>
			</svg>
		</div>
	);
}

function FileTypeIcon({ label }: { label: string }) {
	const isPdf = label === "PDF";
	const isDoc = label === "DOC" || label === "DOCX";

	return (
		<div
			className={
				isPdf
					? "flex size-9 shrink-0 flex-col items-center justify-center rounded-md bg-[#e53935] text-white shadow-sm"
					: isDoc
						? "flex size-9 shrink-0 flex-col items-center justify-center rounded-md bg-brand text-brand-foreground shadow-sm"
						: "flex size-9 shrink-0 flex-col items-center justify-center rounded-md border border-border bg-background text-muted-foreground"
			}
		>
			<span className="text-[9px] font-semibold leading-none tracking-wide">
				{label.slice(0, isPdf || isDoc ? 3 : 4)}
			</span>
		</div>
	);
}

function AttachmentPreviews({
	uploads,
}: {
	uploads: Record<string, AttachmentUploadState>;
}) {
	const attachments = usePromptInputAttachments();

	if (attachments.files.length === 0) {
		return null;
	}

	return (
		<div className="flex flex-wrap gap-2">
			{attachments.files.map((file) => {
				const upload = uploads[file.id];
				const isImage = file.mediaType.startsWith("image/");
				const isUploading = !upload || upload.status === "uploading";
				const isError = upload?.status === "error";
				const progress = upload?.progress ?? 0;
				const typeLabel = fileTypeLabel(file.mediaType, file.filename);
				const displayName = file.filename || "Attachment";

				return (
					<div
						key={file.id}
						className="group relative flex max-w-64 items-center gap-2.5 rounded-xl border border-border bg-background px-2.5 py-2 shadow-sm"
					>
						{isUploading ? (
							<CircularProgress
								value={progress}
								label={`Uploading ${displayName}`}
							/>
						) : isImage ? (
							<img
								src={file.url}
								alt={displayName}
								className="size-9 rounded-md object-cover"
							/>
						) : (
							<FileTypeIcon label={typeLabel} />
						)}
						<div className="min-w-0 flex-1 pr-3">
							<p className="truncate text-sm font-medium text-foreground">
								{displayName}
							</p>
							<p
								className={
									isError
										? "truncate text-[11px] text-destructive"
										: "truncate text-[11px] uppercase tracking-wide text-muted-foreground"
								}
							>
								{isError ? upload?.error || "Upload failed" : typeLabel}
							</p>
						</div>
						<button
							type="button"
							className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full text-muted-foreground opacity-70 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
							onClick={() => attachments.remove(file.id)}
							aria-label="Remove attachment"
						>
							<XIcon size={12} weight="bold" />
						</button>
					</div>
				);
			})}
		</div>
	);
}

function ComposerAttachmentsHeader({
	uploads,
}: {
	uploads: Record<string, AttachmentUploadState>;
}) {
	const attachments = usePromptInputAttachments();
	if (attachments.files.length === 0) {
		return null;
	}

	return (
		<PromptInputHeader className="px-4 pt-3.5 pb-0">
			<AttachmentPreviews uploads={uploads} />
		</PromptInputHeader>
	);
}

function AttachFilesButton({ disabled }: { disabled?: boolean }) {
	const attachments = usePromptInputAttachments();

	return (
		<button
			type="button"
			disabled={disabled}
			onClick={() => attachments.openFileDialog()}
			aria-label="Attach files"
			title="Attach files"
			className="inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
		>
			<PaperclipIcon size={20} weight="duotone" />
		</button>
	);
}

const INPUT_GROUP_STYLE =
	"**:data-[slot=input-group]:rounded-[28px] **:data-[slot=input-group]:border-border/70 **:data-[slot=input-group]:bg-card **:data-[slot=input-group]:shadow-lg";

export function ChatComposer({
	text,
	onTextChange,
	onSubmit,
	onError,
	onLocalFilesChange,
	onDragStateChange,
	onStop,
	status,
	uploads,
	busy,
	canSubmit,
	disabled = false,
	errorMessage,
	above,
	variant = "docked",
	accept = UPLOAD_ACCEPT,
	maxFiles = MAX_UPLOAD_FILES,
	placeholder = "Paste a job description, drop a resume, or ask anything…",
}: ChatComposerProps) {
	const uploading = Object.values(uploads).some(
		(upload) => upload.status === "uploading",
	);
	const isCentered = variant === "centered";
	const inputDisabled = disabled || busy;

	return (
		<div
			className={
				isCentered
					? "w-full"
					: "shrink-0 bg-background px-4 pt-3 pb-4 sm:px-6"
			}
		>
			<div className="mx-auto w-full max-w-3xl">
				{above}
				{errorMessage ? (
					<p className="mb-2 text-sm text-destructive">{errorMessage}</p>
				) : null}
				<PromptInput
					accept={accept}
					multiple
					maxFiles={maxFiles}
					maxFileSize={MAX_UPLOAD_BYTES}
					onSubmit={onSubmit}
					onError={(err) => onError(err.message)}
					className={INPUT_GROUP_STYLE}
				>
					{disabled ? null : (
						<GlobalFileDrop onDragStateChange={onDragStateChange} />
					)}
					<LocalFilesSync onChange={onLocalFilesChange} />
					<ComposerAttachmentsHeader uploads={uploads} />
					<PromptInputBody>
						<PromptInputTextarea
							value={text}
							onChange={(event) =>
								onTextChange(event.currentTarget.value)
							}
							placeholder={placeholder}
							disabled={disabled}
							className="min-h-12 px-4 pt-3.5 pb-1 text-[16px] leading-6 md:text-[16px]"
						/>
					</PromptInputBody>
					<PromptInputFooter className="px-3 pb-2.5 pt-1">
						<PromptInputTools>
							<AttachFilesButton disabled={inputDisabled} />
						</PromptInputTools>
						<div className="flex items-center gap-1">
							<SpeechToTextButton
								text={text}
								onTextChange={onTextChange}
								onError={onError}
								disabled={inputDisabled}
							/>
							<PromptInputSubmit
								status={
									status === "ready" && uploading ? "submitted" : status
								}
								onStop={onStop}
								disabled={
									disabled ||
									(status === "ready"
										? !canSubmit || uploading
										: false)
								}
							/>
						</div>
					</PromptInputFooter>
				</PromptInput>
			</div>
		</div>
	);
}
