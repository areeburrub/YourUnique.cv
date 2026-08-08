"use client";

import { useChat } from "@ai-sdk/react";
import {
	DefaultChatTransport,
	type FileUIPart,
	getToolName,
	isToolUIPart,
	type DynamicToolUIPart,
	type ToolUIPart,
	type UIMessage,
} from "ai";
import { useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { nanoid } from "nanoid";
import { useCallback, useEffect, useRef, useState } from "react";

import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
	Message,
	MessageContent,
	MessageResponse,
} from "@/components/ai-elements/message";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import {
	Tool,
	ToolContent,
	ToolHeader,
	ToolInput,
	ToolOutput,
} from "@/components/ai-elements/tool";
import { useSoftNav } from "@/components/app/soft-nav";
import {
	toFileUIParts,
	uploadChatFile,
	type UploadedFile,
} from "@/lib/client-uploads";
import { getChatThreadHref } from "@/lib/chats";
import {
	chatsKeys,
	prependChatThread,
	refreshChatAfterTurn,
	touchChatThread,
} from "@/lib/chats-query";
import { fileTypeLabel } from "@/lib/file-type";

import {
	ChatComposer,
	type AttachmentUploadState,
} from "./chat-composer";

const toolTitles: Record<string, string> = {
	"name-chat": "Naming chat",
	nameChatTool: "Naming chat",
};

type ChatViewProps = {
	threadId?: string;
	initialMessages?: UIMessage[];
};

type LocalAttachment = FileUIPart & { id: string };

type UploadRecord = AttachmentUploadState & {
	localFile: LocalAttachment;
	uploaded?: UploadedFile;
};

function isChatToolPart(
	part: unknown,
): part is ToolUIPart | DynamicToolUIPart {
	return isToolUIPart(part as never);
}

function titleForTool(name: string) {
	return (
		toolTitles[name] ??
		name
			.replace(/([a-z])([A-Z])/g, "$1 $2")
			.replace(/[-_]/g, " ")
			.replace(/\b\w/g, (char) => char.toUpperCase())
	);
}

const dotWaveDelays = [0, 100, 200, 100, 200, 300, 200, 300, 400] as const;

function ThinkingDots() {
	return (
		<span
			className="grid grid-cols-3 gap-0.5"
			role="status"
			aria-label="Thinking"
		>
			{dotWaveDelays.map((delayMs, index) => (
				<span
					key={index}
					className="size-1 animate-wave-dot rounded-full bg-brand"
					style={{ animationDelay: `${delayMs}ms` }}
				/>
			))}
		</span>
	);
}

function ChatThinking({ label = "Thinking" }: { label?: string }) {
	return (
		<div className="flex items-center gap-2.5 text-muted-foreground">
			<ThinkingDots />
			<span className="text-sm">{label}</span>
		</div>
	);
}

function ChatToolPart({ part }: { part: ToolUIPart | DynamicToolUIPart }) {
	const name = getToolName(part);
	const title = titleForTool(name);
	const isRunning =
		part.state === "input-streaming" || part.state === "input-available";

	return (
		<Tool defaultOpen={isRunning}>
			{part.type === "dynamic-tool" ? (
				<ToolHeader
					title={title}
					type={part.type}
					state={part.state}
					toolName={part.toolName}
				/>
			) : (
				<ToolHeader title={title} type={part.type} state={part.state} />
			)}
			<ToolContent>
				{part.input !== undefined ? <ToolInput input={part.input} /> : null}
				<ToolOutput output={part.output} errorText={part.errorText} />
			</ToolContent>
		</Tool>
	);
}

function FileTypeGlyph({ label }: { label: string }) {
	const isPdf = label === "PDF";
	const isDoc = label === "DOC" || label === "DOCX";

	return (
		<span
			className={
				isPdf
					? "flex size-9 shrink-0 items-center justify-center rounded-md bg-[#e53935] text-white"
					: isDoc
						? "flex size-9 shrink-0 items-center justify-center rounded-md bg-brand text-brand-foreground"
						: "flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
			}
		>
			<span className="text-[9px] font-semibold tracking-wide">
				{label.slice(0, 4)}
			</span>
		</span>
	);
}

function MessageFilePart({
	part,
	messageId,
	index,
}: {
	part: FileUIPart;
	messageId: string;
	index: number;
}) {
	const isImage = part.mediaType.startsWith("image/");
	const typeLabel = fileTypeLabel(part.mediaType, part.filename);
	const displayName = part.filename || "Document";

	if (isImage) {
		return (
			<a
				key={`${messageId}-${index}`}
				href={part.url}
				target="_blank"
				rel="noreferrer"
				className="block overflow-hidden rounded-3xl bg-secondary"
			>
				<img
					src={part.url}
					alt={displayName}
					className="max-h-64 max-w-full object-contain"
				/>
			</a>
		);
	}

	return (
		<a
			key={`${messageId}-${index}`}
			href={part.url}
			target="_blank"
			rel="noreferrer"
			className="inline-flex max-w-[min(100%,20rem)] items-center gap-2.5 rounded-3xl bg-secondary px-3 py-2.5 text-foreground transition-opacity hover:opacity-90"
		>
			<FileTypeGlyph label={typeLabel} />
			<span className="flex min-w-0 flex-col justify-center gap-0.5">
				<span className="truncate text-sm font-medium leading-tight">
					{displayName}
				</span>
				<span className="text-[12px] leading-none text-muted-foreground">
					{typeLabel}
				</span>
			</span>
		</a>
	);
}

function UserMessage({ message }: { message: UIMessage }) {
	const fileParts = message.parts.filter(
		(part): part is FileUIPart => part.type === "file",
	);
	const textParts = message.parts.filter(
		(part) =>
			part.type === "text" &&
			"text" in part &&
			typeof part.text === "string" &&
			part.text.trim().length > 0,
	);

	return (
		<div className="group is-user ml-auto flex w-fit max-w-[min(100%,32rem)] flex-col items-end gap-1.5">
			{fileParts.map((part, index) => (
				<MessageFilePart
					key={`${message.id}-file-${index}`}
					part={part}
					messageId={message.id}
					index={index}
				/>
			))}
			{textParts.map((part, index) => (
				<MessageContent key={`${message.id}-text-${index}`}>
					{"text" in part ? (
						<p className="whitespace-pre-wrap wrap-break-word leading-relaxed">
							{part.text}
						</p>
					) : null}
				</MessageContent>
			))}
		</div>
	);
}

export function ChatView({
	threadId: threadIdProp,
	initialMessages = [],
}: ChatViewProps) {
	const { softReplace } = useSoftNav();
	const queryClient = useQueryClient();
	const [text, setText] = useState("");
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [uploads, setUploads] = useState<Record<string, UploadRecord>>({});
	const [isDraggingFiles, setIsDraggingFiles] = useState(false);
	const threadIdRef = useRef(threadIdProp);
	const chatSessionId = useRef(threadIdProp ?? "new-chat");
	const threadExistsRef = useRef(Boolean(threadIdProp));
	const uploadsRef = useRef(uploads);
	const inFlightUploads = useRef(new Set<string>());
	const prevStatusRef = useRef<string>("ready");

	useEffect(() => {
		uploadsRef.current = uploads;
	}, [uploads]);

	useEffect(() => {
		if (!threadIdProp) {
			return;
		}
		threadIdRef.current = threadIdProp;
		chatSessionId.current = threadIdProp;
		threadExistsRef.current = true;
	}, [threadIdProp]);

	const { messages, sendMessage, status, stop, error } = useChat({
		id: chatSessionId.current,
		messages: initialMessages,
		transport: new DefaultChatTransport({
			api: "/api/chat",
			prepareSendMessagesRequest: ({
				messages: nextMessages,
				body,
				id,
				trigger,
				messageId,
			}) => ({
				body: {
					...body,
					id,
					trigger,
					messageId,
					messages: nextMessages,
					threadId: threadIdRef.current,
				},
			}),
		}),
	});

	useEffect(() => {
		const prev = prevStatusRef.current;
		prevStatusRef.current = status;
		const wasBusy = prev === "submitted" || prev === "streaming";
		const threadId = threadIdRef.current;
		if (status !== "ready" || !wasBusy || !threadId) {
			return;
		}

		const timers = refreshChatAfterTurn(queryClient, threadId);
		return () => {
			for (const timer of timers) {
				window.clearTimeout(timer);
			}
		};
	}, [queryClient, status]);

	const startUpload = useCallback((file: LocalAttachment) => {
		if (inFlightUploads.current.has(file.id)) {
			return;
		}
		inFlightUploads.current.add(file.id);
		setUploadError(null);
		setUploads((prev) => ({
			...prev,
			[file.id]: {
				localFile: file,
				status: "uploading",
				progress: 0,
			},
		}));

		void uploadChatFile({
			file,
			threadId: threadExistsRef.current
				? threadIdRef.current
				: undefined,
			onProgress: (progress) => {
				setUploads((prev) => {
					const current = prev[file.id];
					if (!current || current.status === "error") {
						return prev;
					}
					return {
						...prev,
						[file.id]: {
							...current,
							status: "uploading",
							progress: progress.percent,
						},
					};
				});
			},
		})
			.then((uploaded) => {
				setUploads((prev) => {
					if (!prev[file.id]) {
						return prev;
					}
					return {
						...prev,
						[file.id]: {
							localFile: file,
							status: "ready",
							progress: 100,
							uploaded,
						},
					};
				});
			})
			.catch((err) => {
				const message =
					err instanceof Error ? err.message : "Failed to upload file";
				setUploads((prev) => {
					if (!prev[file.id]) {
						return prev;
					}
					return {
						...prev,
						[file.id]: {
							localFile: file,
							status: "error",
							progress: 0,
							error: message,
						},
					};
				});
				setUploadError(message);
			})
			.finally(() => {
				inFlightUploads.current.delete(file.id);
			});
	}, []);

	const handleLocalFilesChange = useCallback(
		(files: LocalAttachment[]) => {
			const nextIds = new Set(files.map((file) => file.id));
			const prevIds = new Set(Object.keys(uploadsRef.current));
			const sameIds =
				nextIds.size === prevIds.size &&
				[...nextIds].every((id) => prevIds.has(id));

			if (!sameIds) {
				setUploads((prev) => {
					const next: Record<string, UploadRecord> = {};
					for (const file of files) {
						const existing = prev[file.id];
						if (existing) {
							next[file.id] = existing;
						}
					}
					for (const id of Object.keys(prev)) {
						if (!nextIds.has(id)) {
							inFlightUploads.current.delete(id);
						}
					}
					return next;
				});
			}

			for (const file of files) {
				const existing = uploadsRef.current[file.id];
				if (!existing && !inFlightUploads.current.has(file.id)) {
					startUpload(file);
				}
			}
		},
		[startUpload],
	);

	const submitMessage = (messageText: string, fileParts: FileUIPart[]) => {
		setUploadError(null);

		const preview = messageText.replace(/\s+/g, " ").trim().slice(0, 160);
		const now = new Date().toISOString();
		let created = false;

		if (!threadIdRef.current) {
			const newThreadId = nanoid();
			threadIdRef.current = newThreadId;
			created = true;
			softReplace(getChatThreadHref(newThreadId));
			prependChatThread(queryClient, {
				id: newThreadId,
				title: "New chat",
				preview,
				updatedAt: now,
			});
		} else {
			touchChatThread(queryClient, threadIdRef.current, {
				preview: preview || undefined,
				updatedAt: now,
			});
		}

		threadExistsRef.current = true;
		setUploads({});
		inFlightUploads.current.clear();

		void sendMessage({ text: messageText, files: fileParts }).catch(
			(err) => {
				setUploadError(
					err instanceof Error ? err.message : "Something went wrong",
				);
				if (created && threadIdRef.current) {
					void queryClient.invalidateQueries({
						queryKey: chatsKeys.all,
					});
				}
			},
		);
	};
	const handleSubmit = (message: PromptInputMessage) => {
		const trimmed = message.text.trim();
		const localFiles = message.files ?? [];
		if ((!trimmed && localFiles.length === 0) || status !== "ready") {
			return Promise.reject(new Error("Nothing to send"));
		}

		const uploadEntries = localFiles.map((file) => {
			const id = file.id;
			if (!id) {
				return null;
			}
			return uploadsRef.current[id] ?? null;
		});

		if (uploadEntries.some((entry) => entry?.status === "uploading")) {
			setUploadError("Wait for uploads to finish");
			return Promise.reject(new Error("Wait for uploads to finish"));
		}

		if (uploadEntries.some((entry) => !entry || entry.status !== "ready")) {
			setUploadError(
				"Some attachments failed to upload. Remove and retry.",
			);
			return Promise.reject(new Error("Attachment upload incomplete"));
		}

		const uploaded = uploadEntries.map((entry) => entry!.uploaded!);
		setText("");
		setUploadError(null);
		submitMessage(trimmed, toFileUIParts(uploaded));
	};

	const uploadStates: Record<string, AttachmentUploadState> = {};
	for (const [id, upload] of Object.entries(uploads)) {
		uploadStates[id] = {
			status: upload.status,
			progress: upload.progress,
			error: upload.error,
		};
	}

	const uploading = Object.values(uploads).some(
		(upload) => upload.status === "uploading",
	);
	const hasReadyUploads = Object.values(uploads).some(
		(upload) => upload.status === "ready",
	);
	const busy = status !== "ready";
	const canSubmit =
		(Boolean(text.trim()) || hasReadyUploads) && !uploading;
	const lastMessage = messages.at(-1);
	const lastHasAssistantText =
		lastMessage?.role === "assistant" &&
		lastMessage.parts.some(
			(part) =>
				part.type === "text" &&
				"text" in part &&
				typeof part.text === "string" &&
				part.text.trim().length > 0,
		);
	const lastHasTools =
		lastMessage?.role === "assistant" &&
		lastMessage.parts.some((part) => isChatToolPart(part));
	const showThinking =
		!lastHasAssistantText &&
		(status === "submitted" ||
			(status === "streaming" && !lastHasTools));
	const isEmpty = messages.length === 0 && !showThinking;
	const composer = (
		<ChatComposer
			text={text}
			onTextChange={setText}
			onSubmit={handleSubmit}
			onError={setUploadError}
			onLocalFilesChange={handleLocalFilesChange}
			onDragStateChange={setIsDraggingFiles}
			onStop={stop}
			status={status}
			uploads={uploadStates}
			busy={busy}
			canSubmit={canSubmit}
			variant={isEmpty ? "centered" : "docked"}
			errorMessage={
				error || uploadError
					? uploadError ||
						error?.message ||
						"Something went wrong. Try again."
					: null
			}
		/>
	);

	return (
		<div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
			{isDraggingFiles ? (
				<div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-background/80 px-6 backdrop-blur-[2px]">
					<div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-media border border-dashed border-brand/50 bg-surface-subtle px-6 py-8 text-center shadow-sm">
						<div className="flex size-12 items-center justify-center rounded-media border border-border bg-background text-brand">
							<Upload className="size-5" />
						</div>
						<div className="space-y-1">
							<p className="font-medium text-sm">Drop files to attach</p>
							<p className="text-muted-foreground text-xs">
								Images, PDFs, and documents up to 10MB
							</p>
						</div>
					</div>
				</div>
			) : null}
			{isEmpty ? (
				<div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-16 sm:px-6">
					<div className="flex w-full max-w-3xl flex-col items-center gap-10">
						<h1 className="text-center font-display text-[36px] font-bold leading-[1.1] tracking-[-1.2px] text-foreground sm:text-[44px]">
							How can I help you today?
						</h1>
						{composer}
					</div>
				</div>
			) : (
				<>
					<Conversation className="min-h-0 flex-1 overflow-hidden">
						<ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-6 sm:px-6">
							{messages.length === 0 && showThinking ? (
								<Message from="assistant">
									<MessageContent>
										<ChatThinking />
									</MessageContent>
								</Message>
							) : (
								<>
									{messages.map((message) => {
										if (message.role === "user") {
											return (
												<UserMessage key={message.id} message={message} />
											);
										}

										return (
											<Message from={message.role} key={message.id}>
												<MessageContent>
													{message.parts.map((part, index) => {
														if (part.type === "text") {
															return (
																<MessageResponse
																	key={`${message.id}-${index}`}
																>
																	{part.text}
																</MessageResponse>
															);
														}
														if (part.type === "file") {
															return (
																<MessageFilePart
																	key={`${message.id}-${index}`}
																	part={part}
																	messageId={message.id}
																	index={index}
																/>
															);
														}
														if (isChatToolPart(part)) {
															return (
																<ChatToolPart
																	key={`${message.id}-${index}`}
																	part={part}
																/>
															);
														}
														return null;
													})}
												</MessageContent>
											</Message>
										);
									})}
									{showThinking ? (
										<Message from="assistant">
											<MessageContent>
												<ChatThinking />
											</MessageContent>
										</Message>
									) : null}
								</>
							)}
						</ConversationContent>
						<ConversationScrollButton />
					</Conversation>
					{composer}
				</>
			)}
		</div>
	);
}
