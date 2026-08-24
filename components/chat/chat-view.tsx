"use client";

import { useChat } from "@ai-sdk/react";
import {
	DefaultChatTransport,
	getToolName,
	type FileUIPart,
	type UIMessage,
} from "ai";
import { useQueryClient } from "@tanstack/react-query";
import { ChatTextIcon, FileTextIcon, PlusIcon, UploadSimpleIcon, XIcon } from "@phosphor-icons/react";
import { nanoid } from "nanoid";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import {
	Conversation,
	ConversationContent,
	ConversationEmptyState,
	ConversationScrollButton,
	ConversationScrollOnUserMessage,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { useSoftNav } from "@/components/app/soft-nav";
import {
	ChatComposer,
	type AttachmentUploadState,
} from "@/components/chat/chat-composer";
import {
	ChatEmptySuggestions,
	selectPromptPlaceholder,
} from "@/components/chat/chat-empty-suggestions";
import { ChatInterruptBanner } from "@/components/chat/chat-interrupt-banner";
import { ProductHuntUpvoteBanner } from "@/components/chat/product-hunt-upvote-banner";
import {
	assistantHasVisibleActivity,
	ChatThinking,
	getAssistantToolStatusLabel,
	isChatToolPart,
	renderAssistantParts,
	UserMessage,
} from "@/components/chat/chat-message-parts";
import { agentDataPartsFromMessage } from "@/components/chat/tool-activity";
import { DailyUsageWarning } from "@/components/chat/daily-usage-warning";
import { UsageLimitDialog } from "@/components/chat/usage-limit-dialog";
import { Button } from "@/components/ui/button";
import { useUsageStatus } from "@/hooks/use-usage-status";
import {
	toFileUIParts,
	uploadChatFile,
	type UploadedFile,
} from "@/lib/client-uploads";
import {
	clearChatTurnInFlight,
	markChatTurnInFlight,
	wasChatTurnInterrupted,
} from "@/lib/chat-interrupt";
import {
	getChatThreadHref,
	getProfileChatThreadHref,
} from "@/lib/chats";
import {
	chatsKeys,
	prependChatThread,
	refreshChatAfterTurn,
	touchChatThread,
} from "@/lib/chats-query";
import { MixpanelEvent, trackEvent } from "@/lib/mixpanel";
import { usageStatusKey } from "@/lib/usage-status";
import { cn } from "@/lib/utils";

export type ChatContextSnippet = {
	id: string;
	text: string;
};

type ChatViewProps = {
	threadId?: string;
	initialMessages?: UIMessage[];
	variant?: "page" | "panel";
	chatSurface?: "main" | "profile";
	contextSnippets?: ChatContextSnippet[];
	onRemoveSnippet?: (id: string) => void;
	onClearSnippets?: () => void;
	onProfileUpdated?: (profile: string) => void;
	onNewChat?: () => void;
	onOpenProfile?: () => void;
	className?: string;
};

type LocalAttachment = FileUIPart & { id: string };

type UploadRecord = AttachmentUploadState & {
	localFile: LocalAttachment;
	uploaded?: UploadedFile;
};

function buildMessageWithContext(
	text: string,
	snippets: ChatContextSnippet[],
) {
	const trimmed = text.trim();
	if (snippets.length === 0) {
		return trimmed;
	}

	const blocks = snippets
		.map(
			(snippet) =>
				`[Profile context]\n${snippet.text.trim()}\n[/Profile context]`,
		)
		.join("\n\n");

	return trimmed ? `${blocks}\n\n${trimmed}` : blocks;
}

function isProfileUpdateTool(name: string) {
	return (
		name === "patch_profile" ||
		name === "update_profile" ||
		name === "profileEditAgent" ||
		name === "agent-profileEditAgent" ||
		name.endsWith("profileEditAgent")
	);
}

function profileFromToolOutput(
	name: string,
	output: unknown,
): string | null | undefined {
	if (!isProfileUpdateTool(name)) {
		return undefined;
	}
	const record = output as
		| { ok?: boolean; profile?: string }
		| undefined;
	if (
		(name === "patch_profile" || name === "update_profile") &&
		!record?.ok
	) {
		return undefined;
	}
	if (typeof record?.profile === "string") {
		return record.profile;
	}
	return null;
}

function latestSuccessfulPatchKey(messages: UIMessage[]) {
	for (let i = messages.length - 1; i >= 0; i -= 1) {
		const message = messages[i];
		if (message.role !== "assistant") {
			continue;
		}
		for (let j = message.parts.length - 1; j >= 0; j -= 1) {
			const part = message.parts[j];
			if (!isChatToolPart(part)) {
				continue;
			}
			if (part.state !== "output-available") {
				continue;
			}
			const name = getToolName(part);
			const profile = profileFromToolOutput(name, part.output);
			if (profile === undefined) {
				continue;
			}
			return { key: `${message.id}:${j}`, profile };
		}

		for (const [agentIndex, agentPart] of agentDataPartsFromMessage(
			message,
		).entries()) {
			const data = agentPart.data as {
				toolResults?: Array<{
					payload?: {
						toolCallId?: string;
						toolName?: string;
						result?: unknown;
						isError?: boolean;
					};
				}>;
				steps?: Array<{
					toolResults?: Array<{
						payload?: {
							toolCallId?: string;
							toolName?: string;
							result?: unknown;
							isError?: boolean;
						};
					}>;
				}>;
			};
			const results = [
				...(data.steps ?? []).flatMap(
					(step) => step.toolResults ?? [],
				),
				...(data.toolResults ?? []),
			];
			for (let r = results.length - 1; r >= 0; r -= 1) {
				const result = results[r]?.payload;
				if (!result?.toolName || result.isError) {
					continue;
				}
				const profile = profileFromToolOutput(
					result.toolName,
					result.result,
				);
				if (profile === undefined) {
					continue;
				}
				return {
					key: `${message.id}:agent-${agentIndex}:${result.toolCallId || r}`,
					profile,
				};
			}
		}
	}
	return null;
}

function lastTurnLooksUnfinished(messages: UIMessage[]) {
	const last = messages.at(-1);
	if (!last) {
		return false;
	}
	if (last.role === "user") {
		return true;
	}
	if (last.role !== "assistant") {
		return false;
	}
	return !last.parts.some(
		(part) =>
			part.type === "text" &&
			"text" in part &&
			typeof part.text === "string" &&
			part.text.trim().length > 0,
	);
}

export function ChatView({
	threadId: threadIdProp,
	initialMessages = [],
	variant = "page",
	chatSurface = "main",
	contextSnippets = [],
	onRemoveSnippet,
	onClearSnippets,
	onProfileUpdated,
	onNewChat,
	onOpenProfile,
	className,
}: ChatViewProps) {
	const { softReplace } = useSoftNav();
	const queryClient = useQueryClient();
	const usageStatus = useUsageStatus();
	const [usageDialogOpen, setUsageDialogOpen] = useState(false);
	const [interrupted, setInterrupted] = useState(() => {
		if (!threadIdProp) {
			return false;
		}
		if (
			wasChatTurnInterrupted(threadIdProp) &&
			lastTurnLooksUnfinished(initialMessages)
		) {
			return true;
		}
		clearChatTurnInFlight(threadIdProp);
		return false;
	});
	const [text, setText] = useState("");
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const pendingSuggestionRef = useRef<string | null>(null);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [uploads, setUploads] = useState<Record<string, UploadRecord>>({});
	const [isDraggingFiles, setIsDraggingFiles] = useState(false);
	const threadIdRef = useRef(threadIdProp);
	const chatSessionId = useRef(
		threadIdProp ?? (variant === "panel" ? "profile-new" : "new-chat"),
	);
	const threadExistsRef = useRef(Boolean(threadIdProp));
	const uploadsRef = useRef(uploads);
	const inFlightUploads = useRef(new Set<string>());
	const prevStatusRef = useRef<string>("ready");
	const usageLimitTrackedRef = useRef(false);
	const snippetsRef = useRef(contextSnippets);
	const lastAppliedPatchKey = useRef<string | null>(null);
	const chatSurfaceRef = useRef(chatSurface);
	const isPanel = variant === "panel";

	useEffect(() => {
		uploadsRef.current = uploads;
	}, [uploads]);

	useEffect(() => {
		snippetsRef.current = contextSnippets;
	}, [contextSnippets]);

	useEffect(() => {
		chatSurfaceRef.current = chatSurface;
	}, [chatSurface]);

	useLayoutEffect(() => {
		const pending = pendingSuggestionRef.current;
		if (!pending || text !== pending) {
			return;
		}
		pendingSuggestionRef.current = null;
		const el = textareaRef.current;
		if (el) {
			selectPromptPlaceholder(el, text);
		}
	}, [text]);

	useEffect(() => {
		if (!threadIdProp) {
			return;
		}
		threadIdRef.current = threadIdProp;
		chatSessionId.current = threadIdProp;
		threadExistsRef.current = true;
		if (
			wasChatTurnInterrupted(threadIdProp) &&
			lastTurnLooksUnfinished(initialMessages)
		) {
			setInterrupted(true);
			return;
		}
		if (!lastTurnLooksUnfinished(initialMessages)) {
			clearChatTurnInFlight(threadIdProp);
		}
	}, [initialMessages, threadIdProp]);

	const threadHrefFor = useCallback(
		(id: string) =>
			chatSurface === "profile"
				? getProfileChatThreadHref(id)
				: getChatThreadHref(id),
		[chatSurface],
	);

	const { messages, sendMessage, regenerate, clearError, status, stop, error } =
		useChat({
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
						chatSurface: chatSurfaceRef.current,
					},
				}),
			}),
		});

	useEffect(() => {
		const prev = prevStatusRef.current;
		prevStatusRef.current = status;
		const wasBusy = prev === "submitted" || prev === "streaming";
		const threadId = threadIdRef.current;
		if (status === "submitted" || status === "streaming") {
			if (threadId) {
				markChatTurnInFlight(threadId);
			}
			setInterrupted(false);
		} else if (status === "error") {
			if (threadId) {
				markChatTurnInFlight(threadId);
			}
			setInterrupted(true);
			trackEvent(MixpanelEvent.ChatTurnFailed, {
				surface: chatSurface,
			});
		} else if (status === "ready" && wasBusy && threadId) {
			clearChatTurnInFlight(threadId);
			setInterrupted(false);
		}
		if (status !== "ready" || !wasBusy || !threadId) {
			return;
		}

		void queryClient.invalidateQueries({ queryKey: usageStatusKey });
		const timers = refreshChatAfterTurn(queryClient, threadId);
		return () => {
			for (const timer of timers) {
				window.clearTimeout(timer);
			}
		};
	}, [chatSurface, queryClient, status]);

	useEffect(() => {
		if (!usageStatus.data?.blocked) {
			usageLimitTrackedRef.current = false;
			return;
		}
		setUsageDialogOpen(true);
		if (usageLimitTrackedRef.current) {
			return;
		}
		usageLimitTrackedRef.current = true;
		trackEvent(MixpanelEvent.UsageLimitHit, {
			plan: usageStatus.data.plan.id,
			scope: usageStatus.data.scope,
			blocked: true,
		});
	}, [usageStatus.data]);

	useEffect(() => {
		if (!onProfileUpdated) {
			return;
		}
		const patched = latestSuccessfulPatchKey(messages);
		if (!patched || patched.key === lastAppliedPatchKey.current) {
			return;
		}
		lastAppliedPatchKey.current = patched.key;

		if (patched.profile) {
			onProfileUpdated(patched.profile);
			return;
		}

		let cancelled = false;
		void (async () => {
			try {
				const response = await fetch("/api/profile");
				if (!response.ok) {
					return;
				}
				const data = (await response.json()) as {
					profile?: string;
				};
				if (
					!cancelled &&
					typeof data.profile === "string" &&
					data.profile.trim()
				) {
					onProfileUpdated(data.profile);
				}
			} catch {
				return;
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [messages, onProfileUpdated]);

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

	const submitMessage = useCallback(
		(messageText: string, fileParts: FileUIPart[]) => {
			setUploadError(null);

			const preview = messageText.replace(/\s+/g, " ").trim().slice(0, 160);
			const now = new Date().toISOString();
			let created = false;

			if (!threadIdRef.current) {
				const newThreadId = nanoid();
				threadIdRef.current = newThreadId;
				created = true;
				softReplace(threadHrefFor(newThreadId));
				prependChatThread(queryClient, {
					id: newThreadId,
					title: "New chat",
					preview,
					updatedAt: now,
					kind: "chat",
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
			onClearSnippets?.();

			trackEvent(MixpanelEvent.ChatMessageSent, {
				surface: chatSurface,
				is_new_thread: created,
				has_attachments: fileParts.length > 0,
				has_profile_context: snippetsRef.current.length > 0,
			});

			void sendMessage({ text: messageText, files: fileParts }).catch(
				(err) => {
					setUploadError(
						err instanceof Error
							? err.message
							: "Something went wrong",
					);
					if (created && threadIdRef.current) {
						void queryClient.invalidateQueries({
							queryKey: chatsKeys.all,
						});
					}
				},
			);
		},
		[
			chatSurface,
			onClearSnippets,
			queryClient,
			sendMessage,
			softReplace,
			threadHrefFor,
		],
	);

	const handleSubmit = (message: PromptInputMessage) => {
		if (usageStatus.data?.blocked) {
			setUsageDialogOpen(true);
			return Promise.reject(new Error("Usage limit reached"));
		}

		const nextText = buildMessageWithContext(
			message.text,
			snippetsRef.current,
		);
		const localFiles = message.files ?? [];
		if (
			(!nextText && localFiles.length === 0) ||
			status === "submitted" ||
			status === "streaming"
		) {
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

		if (
			localFiles.length > 0 &&
			uploadEntries.some((entry) => !entry || entry.status !== "ready")
		) {
			setUploadError(
				"Some attachments failed to upload. Remove and retry.",
			);
			return Promise.reject(new Error("Attachment upload incomplete"));
		}

		const uploaded = uploadEntries
			.filter((entry): entry is UploadRecord => Boolean(entry?.uploaded))
			.map((entry) => entry.uploaded!);
		setText("");
		setUploadError(null);
		submitMessage(nextText, toFileUIParts(uploaded));
	};

	const applySuggestion = useCallback((prompt: string) => {
		if (usageStatus.data?.blocked) {
			setUsageDialogOpen(true);
			return;
		}
		pendingSuggestionRef.current = prompt;
		setText(prompt);
	}, [usageStatus.data?.blocked]);

	const handleRetry = () => {
		if (usageStatus.data?.blocked) {
			setUsageDialogOpen(true);
			return;
		}
		if (status === "submitted" || status === "streaming") {
			return;
		}
		if (!messages.some((message) => message.role === "user")) {
			return;
		}
		setUploadError(null);
		setInterrupted(false);
		clearError();
		void regenerate().catch((err) => {
			setInterrupted(true);
			setUploadError(
				err instanceof Error ? err.message : "Something went wrong",
			);
		});
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
	const usageBlocked = Boolean(usageStatus.data?.blocked);
	const showRetry = Boolean(error) || interrupted;
	const isBusy = status === "submitted" || status === "streaming";
	const canSubmit =
		(Boolean(text.trim()) ||
			hasReadyUploads ||
			contextSnippets.length > 0) &&
		!uploading &&
		!usageBlocked;
	const lastMessage = messages.at(-1);
	const lastUserMessage = [...messages]
		.reverse()
		.find((message) => message.role === "user");
	const lastUserHadFiles = Boolean(
		lastUserMessage?.parts.some((part) => part.type === "file"),
	);
	const lastIsAssistant = lastMessage?.role === "assistant";
	const lastHasAssistantText =
		lastIsAssistant &&
		lastMessage.parts.some(
			(part) =>
				part.type === "text" &&
				"text" in part &&
				typeof part.text === "string" &&
				part.text.trim().length > 0,
		);
	const lastHasVisibleActivity =
		lastIsAssistant && lastMessage
			? assistantHasVisibleActivity(lastMessage, {
					streamActive: isBusy,
				})
			: false;
	const runningToolLabel =
		lastIsAssistant && lastMessage
			? getAssistantToolStatusLabel(lastMessage, {
					streamActive: isBusy,
				})
			: null;
	const showThinking =
		!error &&
		isBusy &&
		!lastHasAssistantText &&
		!lastHasVisibleActivity;
	const thinkingLabel =
		runningToolLabel ||
		(lastUserHadFiles ? "Reading your documents…" : "Thinking");
	const isEmpty = messages.length === 0;

	const composer = (
		<>
			{usageStatus.data ? (
				<UsageLimitDialog
					open={usageDialogOpen}
					onOpenChange={setUsageDialogOpen}
					status={usageStatus.data}
				/>
			) : null}
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
				busy={isBusy}
				canSubmit={canSubmit}
				disabled={usageBlocked}
				textareaRef={textareaRef}
				variant={isPanel ? "docked" : isEmpty ? "centered" : "docked"}
				placeholder={
					usageBlocked
						? "Usage limit reached"
						: isPanel
							? "Ask to update your profile, resume, or a job…"
							: undefined
				}
				errorMessage={uploadError}
				above={
					<>
						{usageBlocked ? (
							<button
								type="button"
								onClick={() => setUsageDialogOpen(true)}
								className="mb-2 block w-full rounded-lg border border-border bg-surface-subtle px-3 py-2 text-left text-sm text-muted-foreground hover:text-foreground"
							>
								Usage limit reached — tap for details
							</button>
						) : usageStatus.data ? (
							<DailyUsageWarning
								status={usageStatus.data}
								onUpgrade={() => setUsageDialogOpen(true)}
							/>
						) : null}
						{isPanel || !isEmpty ? (
							<ProductHuntUpvoteBanner className="mb-2" />
						) : null}
						{showRetry ? (
							<ChatInterruptBanner
								onRetry={handleRetry}
								disabled={isBusy || usageBlocked}
							/>
						) : null}
					</>
				}
			/>
		</>
	);

	const messageList = (
		<>
			{messages.map((message) => {
				if (message.role === "user") {
					return <UserMessage key={message.id} message={message} />;
				}

				const streamActive =
					isBusy && lastMessage?.id === message.id;
				const parts = renderAssistantParts(message, { streamActive });
				const showThinkingHere =
					showThinking && lastMessage?.id === message.id;

				if (parts.length === 0 && !showThinkingHere) {
					return null;
				}

				return (
					<Message from={message.role} key={message.id}>
						<MessageContent>
							{parts}
							{showThinkingHere ? (
								<ChatThinking label={thinkingLabel} />
							) : null}
						</MessageContent>
					</Message>
				);
			})}
			{showThinking && !lastIsAssistant ? (
				<Message from="assistant">
					<MessageContent>
						<ChatThinking label={thinkingLabel} />
					</MessageContent>
				</Message>
			) : null}
		</>
	);

	if (isPanel) {
		return (
			<div
				className={cn(
					"relative flex min-h-0 flex-1 flex-col overflow-hidden",
					className,
				)}
			>
				<div className="flex shrink-0 items-center gap-2 border-b border-border/70 px-3 py-2">
					<p className="text-sm font-medium text-foreground">Chat</p>
					<div className="flex-1" />
					{onNewChat ? (
						<Button
							type="button"
							variant="outline"
							size="icon-sm"
							className="size-8"
							aria-label="New chat"
							onClick={onNewChat}
							disabled={isBusy}
						>
							<PlusIcon size={16} weight="bold" />
						</Button>
					) : null}
				</div>

				<Conversation className="min-h-0 flex-1">
					{isEmpty ? (
						<ConversationEmptyState className="px-6">
							<div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-surface-subtle text-muted-foreground">
								<ChatTextIcon size={20} weight="duotone" />
							</div>
							<div className="max-w-[30ch] space-y-1.5">
								<h3 className="font-display text-lg font-semibold tracking-[-0.3px] text-foreground">
									Add to your profile
								</h3>
								<p className="text-sm leading-6 text-muted-foreground">
									Just say what to include, like a skill, a
									project, or a new role, and it lands in your
									document.
								</p>
							</div>
						</ConversationEmptyState>
					) : (
						<>
							<ConversationContent className="gap-4 px-4 py-4">
								{messageList}
							</ConversationContent>
							<ConversationScrollOnUserMessage
								userMessageId={lastUserMessage?.id}
								force={status === "submitted"}
							/>
							<ConversationScrollButton />
						</>
					)}
				</Conversation>

				<div className="shrink-0 border-t border-border p-3">
					{onOpenProfile ? (
						<button
							type="button"
							onClick={onOpenProfile}
							className="mb-2 flex w-full items-center gap-2.5 rounded-2xl bg-pastel-blush px-3 py-2 text-left transition-colors hover:bg-pastel-blush/80"
						>
							<span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-card text-brand">
								<FileTextIcon size={16} weight="duotone" />
							</span>
							<span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
								Your Profile
							</span>
							<span className="shrink-0 text-[11px] font-medium text-brand">
								View
							</span>
						</button>
					) : null}
					{contextSnippets.length > 0 ? (
						<ul className="mb-2 flex flex-wrap gap-1.5">
							{contextSnippets.map((snippet) => (
								<li
									key={snippet.id}
									className="flex max-w-full items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-1 text-xs text-foreground"
								>
									<span className="truncate">
										{snippet.text.length > 48
											? `${snippet.text.slice(0, 48).trimEnd()}…`
											: snippet.text}
									</span>
									{onRemoveSnippet ? (
										<button
											type="button"
											className="rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
											aria-label="Remove context"
											onClick={() =>
												onRemoveSnippet(snippet.id)
											}
										>
											<XIcon size={12} weight="bold" />
										</button>
									) : null}
								</li>
							))}
						</ul>
					) : null}
					{composer}
				</div>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"relative flex min-h-0 flex-1 flex-col overflow-hidden",
				className,
			)}
		>
			{isDraggingFiles ? (
				<div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-background/80 px-6 backdrop-blur-[2px]">
					<div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-[28px] bg-pastel-blush px-6 py-8 text-center product-shadow">
						<div className="flex size-14 items-center justify-center rounded-2xl bg-card text-brand">
							<UploadSimpleIcon size={24} weight="duotone" />
						</div>
						<div className="space-y-1">
							<p className="font-medium text-sm">Drop files to attach</p>
							<p className="text-muted-foreground text-xs">
								Images and PDFs up to 10MB
							</p>
						</div>
					</div>
				</div>
			) : null}
			{isEmpty ? (
				<div className="flex min-h-0 flex-1 flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:justify-center sm:px-6 sm:pb-16">
					<div className="flex min-h-0 w-full max-w-3xl flex-1 flex-col sm:flex-none sm:items-center sm:gap-10">
						<div className="flex min-h-0 flex-1 items-center justify-center px-2 sm:flex-none sm:px-0">
							<h1 className="text-center font-display text-[32px] font-bold leading-[1.1] tracking-[-1.2px] text-foreground sm:text-[44px]">
								How can I help you today?
							</h1>
						</div>
						<div className="flex w-full shrink-0 flex-col gap-3 sm:gap-6">
							<ProductHuntUpvoteBanner />
							<div className="order-2 sm:order-1">{composer}</div>
							<ChatEmptySuggestions
								className="order-1 sm:order-2"
								disabled={usageBlocked}
								onSelect={applySuggestion}
							/>
						</div>
					</div>
				</div>
			) : (
				<>
					<Conversation className="min-h-0 flex-1 overflow-hidden">
						<ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-6 sm:px-6">
							{messageList}
						</ConversationContent>
						<ConversationScrollOnUserMessage
							userMessageId={lastUserMessage?.id}
							force={status === "submitted"}
						/>
						<ConversationScrollButton />
					</Conversation>
					{composer}
				</>
			)}
		</div>
	);
}
