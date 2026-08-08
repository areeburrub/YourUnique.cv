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
import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";

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
import { useSoftNav } from "@/components/app/soft-nav";
import { toFileUIParts, uploadChatFiles } from "@/lib/client-uploads";
import { getChatThreadHref } from "@/lib/chats";

import { ChatComposer } from "./chat-composer";

const suggestions = [
	"Paste a job description and tailor my resume",
	"Help me strengthen my backend experience bullets",
	"Draft a cover letter for this role",
] as const;

const toolTitles: Record<string, string> = {
	"name-chat": "Naming chat",
	nameChatTool: "Naming chat",
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

const dotWaveDelays = [0, 100, 200, 100, 200, 300, 200, 300, 400] as const;

function ThinkingDots() {
	return (
		<span
			className="grid grid-cols-3 gap-[2px]"
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
	const { softReplace } = useSoftNav();
	const [text, setText] = useState("");
	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [attachmentCount, setAttachmentCount] = useState(0);
	const [isDraggingFiles, setIsDraggingFiles] = useState(false);
	const dragDepth = useRef(0);
	const threadIdRef = useRef(threadIdProp);
	const chatSessionId = useRef(threadIdProp ?? "new-chat");
	// A thread only truly exists server-side once /api/chat has been asked
	// to create it. Uploads before that must omit threadId or /api/uploads
	// will 404 looking it up.
	const threadExistsRef = useRef(Boolean(threadIdProp));

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

	const submitMessage = async (messageText: string, files: FileUIPart[]) => {
		setUploadError(null);

		// Assign the thread id and move the URL over synchronously, *before*
		// any network call. This is what makes the transition to /chats/[id]
		// feel instant instead of waiting on a create-chat round trip.
		if (!threadIdRef.current) {
			const newThreadId = nanoid();
			threadIdRef.current = newThreadId;
			softReplace(getChatThreadHref(newThreadId));
		}

		let fileParts: FileUIPart[] = [];
		if (files.length > 0) {
			setUploading(true);
			try {
				const uploaded = await uploadChatFiles({
					files,
					threadId: threadExistsRef.current
						? threadIdRef.current
						: undefined,
				});
				fileParts = toFileUIParts(uploaded);
			} catch (err) {
				setUploading(false);
				setUploadError(
					err instanceof Error ? err.message : "Failed to upload files",
				);
				return;
			}
			setUploading(false);
		}

		// sendMessage synchronously adds the optimistic user bubble before it
		// awaits the network response, so calling it as early as possible
		// (right here, with nothing else pending) is what keeps the UI feeling
		// instant. The API route creates the thread server-side if needed.
		threadExistsRef.current = true;
		try {
			await sendMessage({ text: messageText, files: fileParts });
		} catch (err) {
			setUploadError(
				err instanceof Error ? err.message : "Something went wrong",
			);
		}
	};

	const handleSubmit = (message: PromptInputMessage) => {
		const trimmed = message.text.trim();
		const files = message.files ?? [];
		if (
			(!trimmed && files.length === 0) ||
			uploading ||
			status !== "ready"
		) {
			return;
		}

		setText("");
		setUploadError(null);
		setAttachmentCount(0);
		void submitMessage(trimmed, files);
	};

	const handleSuggestion = (suggestion: string) => {
		if (uploading || status !== "ready") {
			return;
		}
		void submitMessage(suggestion, []);
	};

	const busy = uploading || status !== "ready";
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
		(uploading ||
			status === "submitted" ||
			(status === "streaming" && !lastHasTools));

	const thinkingLabel = uploading ? "Uploading files" : "Thinking";

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
