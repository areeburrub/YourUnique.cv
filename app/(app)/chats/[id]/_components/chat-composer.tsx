"use client";

import { useEffect } from "react";
import type { ChatStatus } from "ai";
import { FileText, Paperclip, XIcon } from "lucide-react";

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
import {
	MAX_UPLOAD_BYTES,
	MAX_UPLOAD_FILES,
	UPLOAD_ACCEPT,
} from "@/lib/uploads";

type ChatComposerProps = {
	text: string;
	onTextChange: (value: string) => void;
	onSubmit: (message: PromptInputMessage) => void | Promise<void>;
	onError: (message: string) => void;
	onAttachmentCountChange: (count: number) => void;
	onStop: () => void;
	status: ChatStatus;
	uploading: boolean;
	busy: boolean;
	canSubmit: boolean;
	errorMessage?: string | null;
};

function AttachmentCountSync({
	onChange,
}: {
	onChange: (count: number) => void;
}) {
	const attachments = usePromptInputAttachments();

	useEffect(() => {
		onChange(attachments.files.length);
	}, [attachments.files.length, onChange]);

	return null;
}

function AttachmentPreviews() {
	const attachments = usePromptInputAttachments();

	if (attachments.files.length === 0) {
		return null;
	}

	return (
		<div className="flex flex-wrap gap-2">
			{attachments.files.map((file) => {
				const isImage = file.mediaType.startsWith("image/");
				return (
					<div
						key={file.id}
						className="relative flex max-w-48 items-center gap-2 rounded-control border border-border bg-surface-subtle px-2 py-1.5"
					>
						{isImage ? (
							<img
								src={file.url}
								alt={file.filename || "Attachment"}
								className="size-8 rounded object-cover"
							/>
						) : (
							<div className="flex size-8 items-center justify-center rounded bg-background text-brand">
								<FileText className="size-3.5" />
							</div>
						)}
						<span className="min-w-0 truncate text-xs text-muted-foreground">
							{file.filename || "Attachment"}
						</span>
						<button
							type="button"
							className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground"
							onClick={() => attachments.remove(file.id)}
							aria-label="Remove attachment"
						>
							<XIcon className="size-3" />
						</button>
					</div>
				);
			})}
		</div>
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
			className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
		>
			<Paperclip className="size-4" />
		</button>
	);
}

export function ChatComposer({
	text,
	onTextChange,
	onSubmit,
	onError,
	onAttachmentCountChange,
	onStop,
	status,
	uploading,
	busy,
	canSubmit,
	errorMessage,
}: ChatComposerProps) {
	return (
		<div className="shrink-0 border-t border-border bg-background px-4 py-4 sm:px-6">
			<div className="mx-auto w-full max-w-3xl">
				{errorMessage ? (
					<p className="mb-2 text-sm text-destructive">{errorMessage}</p>
				) : null}
				<PromptInput
					accept={UPLOAD_ACCEPT}
					multiple
					globalDrop
					maxFiles={MAX_UPLOAD_FILES}
					maxFileSize={MAX_UPLOAD_BYTES}
					onSubmit={onSubmit}
					onError={(err) => onError(err.message)}
				>
					<AttachmentCountSync onChange={onAttachmentCountChange} />
					<PromptInputHeader>
						<AttachmentPreviews />
					</PromptInputHeader>
					<PromptInputBody>
						<PromptInputTextarea
							value={text}
							onChange={(event) =>
								onTextChange(event.currentTarget.value)
							}
							placeholder="Paste a job description, drop a resume, or ask anything…"
							className="min-h-18"
							disabled={uploading}
						/>
					</PromptInputBody>
					<PromptInputFooter>
						<PromptInputTools>
							<AttachFilesButton disabled={busy} />
						</PromptInputTools>
						<PromptInputSubmit
							status={uploading ? "submitted" : status}
							onStop={onStop}
							disabled={
								status === "ready" && !uploading ? !canSubmit : uploading
							}
						/>
					</PromptInputFooter>
				</PromptInput>
			</div>
		</div>
	);
}
