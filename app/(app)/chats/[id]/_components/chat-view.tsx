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
import { FileText, MessageSquare, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState } from "react";

import {
	Conversation,
	ConversationContent,
	ConversationEmptyState,
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
import { Spinner } from "@/components/ui/spinner";
import { toFileUIParts, uploadChatFiles } from "@/lib/client-uploads";
import { getChatThreadHref } from "@/lib/chats";

import { ChatComposer } from "./chat-composer";

const suggestions = [
	"Paste a job description and tailor my resume",
	"Help me strengthen my backend experience bullets",
	"Draft a cover letter for this role",
] as const;

const pendingKey = (threadId: string) => `yourunique:pending-chat:${threadId}`;

const toolTitles: Record<string, string> = {
	"name-chat": "Naming chat",
	nameChatTool: "Naming chat",
};

type PendingPayload = {
	text: string;
	files: FileUIPart[];
};

type ChatViewProps = {
	threadId?: string;
	initialMessages?: UIMessage[];
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

function ChatThinking({ label = "Thinking" }: { label?: string }) {
	return (
		<div
			className="flex items-center gap-2 text-muted-foreground"
			role="status"
			aria-live="polite"
		>
			<Spinner className="size-3.5" />
			<span className="text-sm">
				{label}
				<span className="inline-flex w-4 justify-start">
					<span className="animate-pulse">…</span>
				</span>
			</span>
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

	if (isImage) {
		return (
			<img
				key={`${messageId}-${index}`}
				src={part.url}
				alt={part.filename || "Uploaded image"}
				className="max-h-64 max-w-full rounded-lg border border-border object-contain"
			/>
		);
	}

	return (
		<a
			key={`${messageId}-${index}`}
			href={part.url}
			target="_blank"
			rel="noreferrer"
			className="inline-flex items-center gap-2 rounded-control border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:border-brand/30 hover:bg-surface-subtle"
		>
			<FileText className="size-3.5 text-brand" />
			<span className="truncate">{part.filename || "Document"}</span>
		</a>
	);
}

export function ChatView({
	threadId: threadIdProp,
	initialMessages = [],
}: ChatViewProps) {
	const router = useRouter();
	const [text, setText] = useState("");
	const [creating, setCreating] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [attachmentCount, setAttachmentCount] = useState(0);
	const [isDraggingFiles, setIsDraggingFiles] = useState(false);
	const hydratedPending = useRef(false);
	const dragDepth = useRef(0);
	const threadIdRef = useRef(threadIdProp);
	const chatSessionId = useRef(threadIdProp ?? `new-${crypto.randomUUID()}`);

	useEffect(() => {
		if (!threadIdProp) {
			return;
		}
		threadIdRef.current = threadIdProp;
		chatSessionId.current = threadIdProp;
	}, [threadIdProp]);

	const persistSidebar = useEffectEvent(() => {
		router.refresh();
	});

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
		onFinish: ({ isAbort, isError }) => {
			if (isAbort || isError) {
				return;
			}
			const href = threadIdRef.current
				? getChatThreadHref(threadIdRef.current)
				: null;
			if (href && window.location.pathname !== href) {
				router.replace(href);
			}
			persistSidebar();
		},
	});

	useEffect(() => {
		const hasFiles = (event: DragEvent) =>
			Boolean(event.dataTransfer?.types?.includes("Files"));

		const onDragEnter = (event: DragEvent) => {
			if (!hasFiles(event)) {
				return;
			}
			dragDepth.current += 1;
			setIsDraggingFiles(true);
		};

		const onDragLeave = (event: DragEvent) => {
			if (!hasFiles(event)) {
				return;
			}
			dragDepth.current = Math.max(0, dragDepth.current - 1);
			if (dragDepth.current === 0) {
				setIsDraggingFiles(false);
			}
		};

		const onDrop = () => {
			dragDepth.current = 0;
			setIsDraggingFiles(false);
		};

		const onDragEnd = () => {
			dragDepth.current = 0;
			setIsDraggingFiles(false);
		};

		document.addEventListener("dragenter", onDragEnter);
		document.addEventListener("dragleave", onDragLeave);
		document.addEventListener("drop", onDrop);
		document.addEventListener("dragend", onDragEnd);

		return () => {
			document.removeEventListener("dragenter", onDragEnter);
			document.removeEventListener("dragleave", onDragLeave);
			document.removeEventListener("drop", onDrop);
			document.removeEventListener("dragend", onDragEnd);
		};
	}, []);

	useEffect(() => {
		const threadId = threadIdRef.current;
		if (!threadId || hydratedPending.current || status !== "ready") {
			return;
		}
		const key = pendingKey(threadId);
		const pending = sessionStorage.getItem(key);
		if (!pending) {
			return;
		}
		hydratedPending.current = true;
		sessionStorage.removeItem(key);

		try {
			const payload = JSON.parse(pending) as PendingPayload | string;
			if (typeof payload === "string") {
				void sendMessage({ text: payload });
				return;
			}
			void sendMessage({
				text: payload.text,
				files: payload.files,
			});
		} catch {
			void sendMessage({ text: pending });
		}
	}, [threadIdProp, status, sendMessage]);

	const startThread = async (messageText: string, files: FileUIPart[]) => {
		setCreating(true);
		setUploadError(null);
		try {
			const uploaded =
				files.length > 0 ? await uploadChatFiles({ files }) : [];
			const fileParts = toFileUIParts(uploaded);

			const response = await fetch("/api/chats", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					message: messageText,
					fileIds: uploaded.map((file) => file.id),
				}),
			});
			if (!response.ok) {
				throw new Error("Failed to create chat");
			}
			const data = (await response.json()) as { id: string };
			threadIdRef.current = data.id;
			const href = getChatThreadHref(data.id);
			window.history.replaceState(window.history.state, "", href);

			setCreating(false);
			await sendMessage({
				text: messageText,
				files: fileParts,
			});
		} catch (err) {
			setCreating(false);
			setUploadError(
				err instanceof Error ? err.message : "Failed to start chat",
			);
		}
	};

	const handleSubmit = async (message: PromptInputMessage) => {
		const trimmed = message.text.trim();
		const files = message.files ?? [];
		if (
			(!trimmed && files.length === 0) ||
			creating ||
			uploading ||
			status !== "ready"
		) {
			return;
		}

		setText("");
		setUploadError(null);
		setAttachmentCount(0);

		if (!threadIdRef.current) {
			await startThread(trimmed, files);
			return;
		}

		const threadId = threadIdRef.current;

		try {
			let uploaded: Awaited<ReturnType<typeof uploadChatFiles>> = [];
			if (files.length > 0) {
				setUploading(true);
				try {
					uploaded = await uploadChatFiles({ files, threadId });
				} finally {
					setUploading(false);
				}
			}
			await sendMessage({
				text: trimmed,
				files: toFileUIParts(uploaded),
			});
		} catch (err) {
			setUploading(false);
			setUploadError(
				err instanceof Error ? err.message : "Failed to upload files",
			);
		}
	};

	const handleSuggestion = (suggestion: string) => {
		if (creating || uploading || status !== "ready") {
			return;
		}
		if (!threadIdRef.current) {
			void startThread(suggestion, []);
			return;
		}
		void sendMessage({ text: suggestion });
	};

	const busy = creating || uploading || status !== "ready";
	const canSubmit = Boolean(text.trim()) || attachmentCount > 0;
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
		(creating ||
			uploading ||
			status === "submitted" ||
			(status === "streaming" && !lastHasTools));

	const thinkingLabel = creating
		? "Starting chat"
		: uploading
			? "Uploading files"
			: "Thinking";

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
			<Conversation className="min-h-0 flex-1 overflow-hidden">
				<ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-6 sm:px-6">
					{messages.length === 0 ? (
						showThinking ? (
							<Message from="assistant">
								<MessageContent>
									<ChatThinking label={thinkingLabel} />
								</MessageContent>
							</Message>
						) : (
							<ConversationEmptyState className="gap-5">
								<div className="flex size-12 items-center justify-center rounded-media border border-border bg-surface-subtle text-brand">
									<MessageSquare className="size-5" />
								</div>
								<div className="space-y-1">
									<h3 className="font-medium text-sm">Start a new chat</h3>
									<p className="text-muted-foreground text-sm">
										Paste a job description or ask how to tailor your profile
										for a role.
									</p>
								</div>
								<div className="mt-2 flex w-full max-w-md flex-wrap justify-center gap-2">
									{suggestions.map((suggestion) => (
										<button
											key={suggestion}
											type="button"
											onClick={() => handleSuggestion(suggestion)}
											disabled={busy}
											className="rounded-full border border-border bg-background px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-brand/30 hover:bg-surface-subtle hover:text-foreground disabled:opacity-50"
										>
											{suggestion}
										</button>
									))}
								</div>
							</ConversationEmptyState>
						)
					) : (
						<>
							{messages.map((message) => (
								<Message from={message.role} key={message.id}>
									<MessageContent>
										{message.parts.map((part, index) => {
											if (part.type === "text") {
												return (
													<MessageResponse key={`${message.id}-${index}`}>
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
							))}
							{showThinking ? (
								<Message from="assistant">
									<MessageContent>
										<ChatThinking
											label={uploading ? "Uploading files" : "Thinking"}
										/>
									</MessageContent>
								</Message>
							) : null}
						</>
					)}
				</ConversationContent>
				<ConversationScrollButton />
			</Conversation>

			<ChatComposer
				text={text}
				onTextChange={setText}
				onSubmit={handleSubmit}
				onError={setUploadError}
				onAttachmentCountChange={setAttachmentCount}
				onStop={stop}
				status={status}
				creating={creating}
				uploading={uploading}
				busy={busy}
				canSubmit={canSubmit}
				errorMessage={
					error || uploadError
						? uploadError ||
							error?.message ||
							"Something went wrong. Try again."
						: null
				}
			/>
		</div>
	);
}
