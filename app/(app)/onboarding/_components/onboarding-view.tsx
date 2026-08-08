"use client";

import { useChat } from "@ai-sdk/react";
import type { WorkflowDataPart } from "@mastra/ai-sdk";
import { DefaultChatTransport } from "ai";
import confetti from "canvas-confetti";
import {
	CheckCircle2,
	Circle,
	FileUp,
	LoaderCircle,
	Trash2,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { MessageResponse } from "@/components/ai-elements/message";
import { BrandLogo } from "@/components/landing/brand-logo";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import type { UploadedFile } from "@/lib/client-uploads";
import {
	PROFILE_MARKER,
	STYLE_MARKER,
} from "@/lib/onboarding/markers";
import { uploadOnboardingFile } from "@/lib/onboarding/upload";
import {
	MAX_UPLOAD_BYTES,
	MAX_UPLOAD_FILES,
	ONBOARDING_UPLOAD_ACCEPT,
	isAllowedOnboardingUploadMediaType,
	resolveUploadMediaType,
} from "@/lib/uploads";
import { cn } from "@/lib/utils";

type Step = "upload" | "analyzing" | "done";

type LocalFile = {
	localId: string;
	file: File;
	uploaded?: UploadedFile;
	uploading?: boolean;
	error?: string;
};

type WorkflowData = WorkflowDataPart["data"];

const STEP_META: Record<
	string,
	{
		label: string;
		description: string;
	}
> = {
	"prepare-files": {
		label: "Preparing files",
		description: "Checking ownership and getting documents ready",
	},
	"extract-context": {
		label: "Building your context",
		description: "Extracting profile and writing style from your documents",
	},
};

function formatBytes(size: number) {
	if (size < 1024) {
		return `${size} B`;
	}
	if (size < 1024 * 1024) {
		return `${(size / 1024).toFixed(1)} KB`;
	}
	return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function readResultOutput(output: unknown) {
	if (!output || typeof output !== "object") {
		return null;
	}

	const value = output as {
		profile?: unknown;
		style?: unknown;
		sourceFileIds?: unknown;
	};

	if (
		typeof value.profile !== "string" ||
		typeof value.style !== "string"
	) {
		return null;
	}

	return {
		profile: value.profile,
		style: value.style,
		sourceFileIds: Array.isArray(value.sourceFileIds)
			? value.sourceFileIds.filter(
					(id): id is string => typeof id === "string",
				)
			: [],
	};
}

function extractWorkflowResult(messages: Array<{ parts: unknown[] }>) {
	for (let i = messages.length - 1; i >= 0; i -= 1) {
		const message = messages[i];
		for (let j = message.parts.length - 1; j >= 0; j -= 1) {
			const part = message.parts[j] as {
				type?: string;
				data?: WorkflowData;
			};
			if (part?.type !== "data-workflow" || !part.data) {
				continue;
			}

			const workflow = part.data;
			const result = readResultOutput(
				workflow.steps["extract-context"]?.output,
			);

			if (workflow.status === "success" && result) {
				return {
					...result,
					workflow,
					error: null as string | null,
				};
			}

			if (workflow.status === "failed") {
				return {
					profile: "",
					style: "",
					sourceFileIds: [] as string[],
					workflow,
					error: "Analysis failed. Try again with different files.",
				};
			}

			return {
				profile: "",
				style: "",
				sourceFileIds: [] as string[],
				workflow,
				error: null as string | null,
			};
		}
	}

	return null;
}

function extractStreamingText(
	messages: Array<{ role?: string; parts: unknown[] }>,
) {
	let text = "";

	for (const message of messages) {
		if (message.role !== "assistant") {
			continue;
		}

		for (const part of message.parts) {
			const value = part as { type?: string; text?: string };
			if (value.type === "text" && typeof value.text === "string") {
				text += value.text;
			}
		}
	}

	return text;
}

function splitStreamingPreview(text: string) {
	const profileStart = text.indexOf(PROFILE_MARKER);
	const styleStart = text.indexOf(STYLE_MARKER);

	if (profileStart === -1) {
		return {
			profile: text.trim(),
			style: "",
			active: "profile" as const,
		};
	}

	if (styleStart === -1 || styleStart < profileStart) {
		return {
			profile: text.slice(profileStart + PROFILE_MARKER.length).trim(),
			style: "",
			active: "profile" as const,
		};
	}

	return {
		profile: text
			.slice(profileStart + PROFILE_MARKER.length, styleStart)
			.trim(),
		style: text.slice(styleStart + STYLE_MARKER.length).trim(),
		active: "style" as const,
	};
}

function buildAmbientMarkdown(preview: {
	profile: string;
	style: string;
}) {
	const sections: string[] = [];

	if (preview.profile) {
		sections.push(`### Profile\n\n${preview.profile}`);
	}

	if (preview.style) {
		sections.push(`### Style\n\n${preview.style}`);
	}

	return sections.join("\n\n");
}

function fireConfetti() {
	const colors = ["#025bff", "#576bff", "#22c55e", "#f59e0b", "#ffffff"];
	void confetti({
		particleCount: 120,
		spread: 70,
		origin: { y: 0.65 },
		colors,
	});
	window.setTimeout(() => {
		void confetti({
			particleCount: 80,
			angle: 60,
			spread: 55,
			origin: { x: 0, y: 0.7 },
			colors,
		});
		void confetti({
			particleCount: 80,
			angle: 120,
			spread: 55,
			origin: { x: 1, y: 0.7 },
			colors,
		});
	}, 180);
}

function StepIcon({ status }: { status?: string }) {
	if (status === "success") {
		return <CheckCircle2 className="size-4 text-brand" />;
	}
	if (status === "failed") {
		return <XCircle className="size-4 text-destructive" />;
	}
	if (status === "running") {
		return <LoaderCircle className="size-4 animate-spin text-brand" />;
	}
	return <Circle className="size-4 text-muted-foreground" />;
}

export function OnboardingView() {
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);
	const completingRef = useRef(false);
	const [step, setStep] = useState<Step>("upload");
	const [files, setFiles] = useState<LocalFile[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [finishing, setFinishing] = useState(false);

	const transport = useMemo(
		() =>
			new DefaultChatTransport({
				api: "/api/onboarding/analyze",
			}),
		[],
	);

	const { messages, sendMessage, status, setMessages } = useChat({
		transport,
		onFinish: ({ messages: finishedMessages }) => {
			void (async () => {
				if (completingRef.current) {
					return;
				}

				const result = extractWorkflowResult(finishedMessages);
				if (!result) {
					setError("Analysis finished without a usable result.");
					return;
				}
				if (result.error) {
					setError(result.error);
					return;
				}
				if (!result.profile?.trim() || !result.style?.trim()) {
					setError("Analysis finished without a usable result.");
					return;
				}

				const sourceFileIds =
					result.sourceFileIds.length > 0
						? result.sourceFileIds
						: files
								.filter((file) => file.uploaded)
								.map((file) => file.uploaded!.id);

				completingRef.current = true;
				setFinishing(true);
				setError(null);

				try {
					const response = await fetch("/api/onboarding/complete", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							profile: result.profile.trim(),
							style: result.style.trim(),
							sourceFileIds,
						}),
					});
					const data = (await response.json().catch(() => null)) as {
						error?: string;
					} | null;

					if (!response.ok) {
						throw new Error(
							data?.error || "Failed to save context",
						);
					}

					setStep("done");
					fireConfetti();
					window.setTimeout(() => {
						router.push("/new-chat");
						router.refresh();
					}, 1600);
				} catch (saveError) {
					completingRef.current = false;
					setFinishing(false);
					setError(
						saveError instanceof Error
							? saveError.message
							: "Failed to save context",
					);
				}
			})();
		},
		onError: () => {
			setError("Analysis failed. Please try again.");
		},
	});

	const workflowState = useMemo(
		() => extractWorkflowResult(messages),
		[messages],
	);

	const streamingText = useMemo(
		() => extractStreamingText(messages),
		[messages],
	);
	const streamingPreview = useMemo(
		() => splitStreamingPreview(streamingText),
		[streamingText],
	);
	const ambientMarkdown = useMemo(
		() => buildAmbientMarkdown(streamingPreview),
		[streamingPreview],
	);
	const ambientScrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (step !== "analyzing" || !ambientScrollRef.current) {
			return;
		}
		ambientScrollRef.current.scrollTop =
			ambientScrollRef.current.scrollHeight;
	}, [ambientMarkdown, step]);

	const readyCount = files.filter((file) => file.uploaded && !file.error)
		.length;
	const busy =
		files.some((file) => file.uploading) ||
		status === "streaming" ||
		finishing ||
		step === "done";

	async function handleFilesSelected(list: FileList | null) {
		if (!list?.length) {
			return;
		}

		setError(null);
		const remaining = MAX_UPLOAD_FILES - files.length;
		if (remaining <= 0) {
			setError(`You can upload up to ${MAX_UPLOAD_FILES} files.`);
			return;
		}

		const selected = Array.from(list).slice(0, remaining);
		const next: LocalFile[] = [];

		for (const file of selected) {
			const mediaType = resolveUploadMediaType({
				filename: file.name,
				mediaType: file.type,
			});
			if (!mediaType || !isAllowedOnboardingUploadMediaType(mediaType)) {
				setError(
					`"${file.name}" is not supported. Use PDF, DOCX, PPTX, images, TXT, or MD.`,
				);
				continue;
			}
			if (file.size > MAX_UPLOAD_BYTES) {
				setError(`"${file.name}" is larger than 10MB.`);
				continue;
			}

			next.push({
				localId: crypto.randomUUID(),
				file,
				uploading: true,
			});
		}

		if (next.length === 0) {
			return;
		}

		setFiles((current) => [...current, ...next]);

		await Promise.all(
			next.map(async (item) => {
				try {
					const uploaded = await uploadOnboardingFile({
						file: item.file,
					});
					setFiles((current) =>
						current.map((entry) =>
							entry.localId === item.localId
								? {
										...entry,
										uploaded,
										uploading: false,
										error: undefined,
									}
								: entry,
						),
					);
				} catch (uploadError) {
					const message =
						uploadError instanceof Error
							? uploadError.message
							: "Upload failed";
					setFiles((current) =>
						current.map((entry) =>
							entry.localId === item.localId
								? {
										...entry,
										uploading: false,
										error: message,
									}
								: entry,
						),
					);
				}
			}),
		);
	}

	function removeFile(localId: string) {
		setFiles((current) =>
			current.filter((entry) => entry.localId !== localId),
		);
	}

	async function startAnalysis() {
		const fileIds = files
			.filter((file) => file.uploaded && !file.error)
			.map((file) => file.uploaded!.id);

		if (fileIds.length === 0) {
			setError("Upload at least one document to continue.");
			return;
		}

		completingRef.current = false;
		setFinishing(false);
		setError(null);
		setMessages([]);
		setStep("analyzing");
		await sendMessage(
			{ text: "Analyze my career documents" },
			{ body: { fileIds } },
		);
	}

	const workflowSteps = workflowState?.workflow.steps ?? {};
	const allStepsDone =
		step === "done" ||
		finishing ||
		Object.keys(STEP_META).every(
			(stepId) => workflowSteps[stepId]?.status === "success",
		);

	return (
		<div className="flex min-h-full flex-1 flex-col bg-background">
			<header className="border-b border-border">
				<div className="rail flex h-14 items-center justify-between px-4 sm:px-8 md:px-10">
					<BrandLogo />
					<ModeToggle />
				</div>
			</header>

			<main className="rail flex flex-1 flex-col px-4 py-10 sm:px-8 md:px-10">
				<div className="mx-auto w-full max-w-3xl">
					<p className="eyebrow text-brand!">Onboarding</p>
					<h1 className="font-display mt-3 text-[36px] leading-11 font-semibold tracking-[-0.72px] text-foreground sm:text-[40px] sm:leading-12">
						Build your career context
					</h1>
					<p className="mt-3 max-w-2xl text-base leading-6 text-muted-foreground">
						Upload up to {MAX_UPLOAD_FILES} career documents —
						resume, experience letters, offer letters, cover
						letters, and similar files. We&apos;ll build your
						context and take you into the app.
					</p>

					{error ? (
						<p className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
							{error}
						</p>
					) : null}

					{step === "upload" ? (
						<section className="mt-8 space-y-6">
							<button
								type="button"
								onClick={() => inputRef.current?.click()}
								disabled={
									busy || files.length >= MAX_UPLOAD_FILES
								}
								className={cn(
									"flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-subtle px-6 py-12 text-center transition-colors hover:border-brand/40 hover:bg-brand/3",
									(busy ||
										files.length >= MAX_UPLOAD_FILES) &&
										"pointer-events-none opacity-60",
								)}
							>
								<span className="flex size-10 items-center justify-center rounded-full bg-brand/10 text-brand">
									<FileUp className="size-5" />
								</span>
								<p className="mt-4 text-sm font-medium text-foreground">
									Drop files here or click to browse
								</p>
								<p className="mt-1 text-sm text-muted-foreground">
									PDF, DOCX, PPTX, images, TXT, MD · max{" "}
									{MAX_UPLOAD_FILES} files · 10MB each
								</p>
							</button>
							<input
								ref={inputRef}
								type="file"
								accept={ONBOARDING_UPLOAD_ACCEPT}
								multiple
								className="hidden"
								onChange={(event) => {
									void handleFilesSelected(
										event.target.files,
									);
									event.target.value = "";
								}}
							/>

							{files.length > 0 ? (
								<ul className="space-y-3">
									{files.map((entry) => (
										<li
											key={entry.localId}
											className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
										>
											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-medium text-foreground">
													{entry.file.name}
												</p>
												<p className="mt-0.5 text-xs text-muted-foreground">
													{formatBytes(entry.file.size)}
													{entry.uploading
														? " · Uploading…"
														: entry.error
															? ` · ${entry.error}`
															: " · Ready"}
												</p>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="icon-sm"
												onClick={() =>
													removeFile(entry.localId)
												}
												aria-label={`Remove ${entry.file.name}`}
											>
												<Trash2 className="size-4" />
											</Button>
										</li>
									))}
								</ul>
							) : null}

							<div className="flex justify-end">
								<Button
									type="button"
									size="lg"
									disabled={readyCount === 0 || busy}
									onClick={() => void startAnalysis()}
								>
									Analyze documents
								</Button>
							</div>
						</section>
					) : null}

					{step === "analyzing" ? (
						<section className="relative mt-8 overflow-hidden rounded-2xl border border-border bg-card">
							{ambientMarkdown ? (
								<div
									aria-hidden="true"
									className="pointer-events-none absolute inset-0 overflow-hidden"
								>
									<div
										ref={ambientScrollRef}
										className="h-full overflow-hidden px-7 pt-24 pb-12 opacity-25 select-none sm:px-9"
										style={{
											maskImage:
												"linear-gradient(to bottom, transparent 0%, black 22%, black 68%, transparent 100%)",
											WebkitMaskImage:
												"linear-gradient(to bottom, transparent 0%, black 22%, black 68%, transparent 100%)",
										}}
									>
										<MessageResponse
											className="max-w-none text-[13px] leading-6 text-muted-foreground [&_h1]:font-display [&_h1]:text-base [&_h1]:font-semibold [&_h1]:tracking-[-0.02em] [&_h1]:text-foreground/50 [&_h2]:font-display [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] [&_h2]:text-foreground/50 [&_h3]:font-display [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:tracking-[-0.02em] [&_h3]:text-foreground/50 [&_li]:my-0.5 [&_p]:my-2 [&_strong]:font-medium [&_strong]:text-foreground/45"
											isAnimating={
												status === "streaming" &&
												!allStepsDone
											}
										>
											{ambientMarkdown}
										</MessageResponse>
									</div>
									<div className="absolute inset-0 bg-gradient-to-b from-card via-card/70 to-card" />
								</div>
							) : null}

							<div className="relative z-10 p-6">
								<div className="flex items-center gap-3">
									{allStepsDone ? (
										<CheckCircle2 className="size-5 text-brand" />
									) : (
										<LoaderCircle className="size-5 animate-spin text-brand" />
									)}
									<div>
										<p className="text-sm font-medium text-foreground">
											{allStepsDone
												? "Finishing up"
												: "Analyzing your documents"}
										</p>
										<p className="text-sm text-muted-foreground">
											{allStepsDone
												? "Saving your context…"
												: ambientMarkdown
													? streamingPreview.active ===
														"style"
														? "Learning how you write…"
														: "Pulling details from your documents…"
													: "Getting your files ready…"}
										</p>
									</div>
								</div>

								{!allStepsDone ? (
									<p className="mt-3 text-xs text-muted-foreground/80">
										<span
											className={cn(
												"transition-colors",
												streamingPreview.profile
													? "text-brand"
													: "text-muted-foreground/60",
											)}
										>
											Profile
										</span>
										<span className="mx-2 text-border">
											·
										</span>
										<span
											className={cn(
												"transition-colors",
												streamingPreview.style
													? "text-brand"
													: "text-muted-foreground/60",
											)}
										>
											Style
										</span>
									</p>
								) : null}

								<ul className="mt-6 space-y-3">
									{Object.keys(STEP_META).map((stepId) => {
										const meta = STEP_META[stepId];
										const stepState = workflowSteps[stepId];
										return (
											<li
												key={stepId}
												className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/85 px-3 py-3 backdrop-blur-sm"
											>
												<StepIcon
													status={
														allStepsDone
															? "success"
															: stepState?.status
													}
												/>
												<div>
													<p className="text-sm font-medium text-foreground">
														{meta.label}
													</p>
													<p className="text-sm text-muted-foreground">
														{meta.description}
													</p>
												</div>
											</li>
										);
									})}
								</ul>

								{error ? (
									<div className="mt-6 flex justify-end">
										<Button
											type="button"
											variant="outline"
											onClick={() => {
												completingRef.current = false;
												setFinishing(false);
												setStep("upload");
												setMessages([]);
												setError(null);
											}}
										>
											Back to upload
										</Button>
									</div>
								) : null}
							</div>
						</section>
					) : null}

					{step === "done" ? (
						<section className="mt-8 flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-16 text-center">
							<span className="flex size-14 items-center justify-center rounded-full bg-brand/10 text-brand">
								<CheckCircle2 className="size-7" />
							</span>
							<p className="font-display mt-5 text-2xl font-semibold tracking-[-0.4px] text-foreground">
								You&apos;re all set
							</p>
							<p className="mt-2 max-w-sm text-sm text-muted-foreground">
								Your career context is ready. Taking you into
								the app…
							</p>
						</section>
					) : null}
				</div>
			</main>
		</div>
	);
}
