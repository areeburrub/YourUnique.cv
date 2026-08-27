"use client";

import { FileArrowUpIcon, TrashIcon } from "@phosphor-icons/react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { dataTransferHasFiles } from "@/lib/file-drag";
import { TOOL_PDF_MAX_BYTES } from "@/lib/tools/constants";
import { ONBOARDING_UPLOAD_ACCEPT } from "@/lib/uploads";
import { cn } from "@/lib/utils";

type ToolResumePickerProps = {
	required: boolean;
	file: File | null;
	error: string | null;
	onFile: (file: File | null) => void;
	onError: (message: string | null) => void;
};

function isPdfFile(file: File) {
	return (
		file.type === "application/pdf" ||
		file.name.toLowerCase().endsWith(".pdf")
	);
}

export function ToolResumePicker({
	required,
	file,
	error,
	onFile,
	onError,
}: ToolResumePickerProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const dragDepth = useRef(0);
	const [dragging, setDragging] = useState(false);

	function resetDrag() {
		dragDepth.current = 0;
		setDragging(false);
	}

	function acceptFile(next: File | undefined) {
		if (!next) {
			return;
		}
		if (!isPdfFile(next)) {
			onError("Upload a PDF resume");
			return;
		}
		if (next.size > TOOL_PDF_MAX_BYTES) {
			onError("Resume must be 8MB or smaller");
			return;
		}
		onError(null);
		onFile(next);
	}

	return (
		<div className="space-y-2">
			<input
				ref={inputRef}
				id="resume-file"
				type="file"
				accept={ONBOARDING_UPLOAD_ACCEPT}
				className="sr-only"
				onChange={(event) => {
					const next = event.target.files?.[0];
					event.target.value = "";
					acceptFile(next);
				}}
			/>
			{file ? (
				<div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
					<div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-pastel-blush text-brand">
						<FileArrowUpIcon size={22} weight="duotone" />
					</div>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-medium text-foreground">
							{file.name}
						</p>
						<p className="text-xs text-muted-foreground">
							PDF · we’ll scan the file
						</p>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={() => {
							onFile(null);
							onError(null);
						}}
						aria-label="Remove resume"
					>
						<TrashIcon size={16} />
					</Button>
				</div>
			) : (
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
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
						const next = event.dataTransfer.files?.[0];
						event.preventDefault();
						resetDrag();
						acceptFile(next);
					}}
					className={cn(
						"flex min-h-28 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-5 py-6 text-center transition-colors",
						dragging
							? "border-brand bg-brand/5"
							: "border-border bg-card hover:border-brand/40",
					)}
				>
					<span className="flex size-11 items-center justify-center rounded-2xl bg-pastel-blush text-brand">
						<FileArrowUpIcon size={22} weight="duotone" />
					</span>
					<div>
						<p className="text-sm font-medium text-foreground">
							{required
								? "Drop or choose your resume PDF"
								: "Optional: drop or choose your resume PDF"}
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							PDF, up to 8MB. We scan the file; we do not save it.
						</p>
					</div>
				</button>
			)}
			{error ? (
				<p className="text-sm text-destructive">{error}</p>
			) : null}
		</div>
	);
}
