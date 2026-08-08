"use client";

import { useChat } from "@ai-sdk/react";
import {
	DefaultChatTransport,
	getToolName,
	isToolUIPart,
	type DynamicToolUIPart,
	type ToolUIPart,
	type UIMessage,
} from "ai";
import { useQueryClient } from "@tanstack/react-query";
import {
	Check,
	ChevronDown,
	FileText,
	LoaderCircle,
	MessageSquareText,
	Plus,
	XIcon,
} from "lucide-react";
import { nanoid } from "nanoid";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { useSoftNav } from "@/components/app/soft-nav";
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
import {
	PromptInput,
	PromptInputBody,
	PromptInputFooter,
	type PromptInputMessage,
	PromptInputSubmit,
	PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getProfileChatThreadHref } from "@/lib/chats";
import {
	prependProfileChatThread,
	refreshProfileChatAfterTurn,
	touchProfileChatThread,
} from "@/lib/profile-chats-query";
import { cn } from "@/lib/utils";

export type ProfileContextSnippet = {
	id: string;
	text: string;
};

type ProfileChatProps = {
	threadId?: string;
	initialMessages?: UIMessage[];
	contextSnippets: ProfileContextSnippet[];
	onRemoveSnippet: (id: string) => void;
	onClearSnippets: () => void;
	onProfileUpdated: (profile: string) => void;
	onNewChat: () => void;
	onOpenProfile?: () => void;
	className?: string;
};

function isChatToolPart(
	part: unknown,
): part is ToolUIPart | DynamicToolUIPart {
	return isToolUIPart(part as never);
}

function toolStepLabel(name: string) {
	if (name === "patch_profile" || name === "update_profile") {
		return "Patch profile";
	}
	if (name === "get_profile") {
		return "Read profile";
	}
	return name
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace(/[-_]/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

function isToolRunning(state: ToolUIPart["state"]) {
	return (
		state === "input-streaming" ||
		state === "input-available" ||
		state === "approval-requested"
	);
}

function isToolFailed(state: ToolUIPart["state"]) {
	return state === "output-error" || state === "output-denied";
}

function isToolDone(state: ToolUIPart["state"]) {
	return state === "output-available";
}

function ProfileToolActivity({
	parts,
	startCollapsed = false,
}: {
	parts: Array<ToolUIPart | DynamicToolUIPart>;
	startCollapsed?: boolean;
}) {
	const allSettled = parts.every(
		(part) => isToolDone(part.state) || isToolFailed(part.state),
	);
	const hasFailure = parts.some((part) => isToolFailed(part.state));
	const anyRunning = parts.some((part) => isToolRunning(part.state));
	const [open, setOpen] = useState(() => !allSettled || !startCollapsed);

	useEffect(() => {
		if (!allSettled) {
			setOpen(true);
			return;
		}
		const timer = window.setTimeout(() => setOpen(false), 700);
		return () => window.clearTimeout(timer);
	}, [allSettled]);

	const showFooter = allSettled || anyRunning;

	return (
		<Collapsible
			open={open}
			onOpenChange={setOpen}
			className="w-full max-w-full"
		>
			<CollapsibleTrigger className="flex items-center gap-1 text-[13px] leading-5 text-muted-foreground transition-colors hover:text-foreground">
				<span>Used Profile tools</span>
				<ChevronDown
					className={cn(
						"size-3.5 transition-transform",
						open && "rotate-180",
					)}
				/>
			</CollapsibleTrigger>
			<CollapsibleContent className="overflow-hidden">
				<ol className="mt-2 flex flex-col">
					{parts.map((part, index) => {
						const name = getToolName(part);
						const running = isToolRunning(part.state);
						const failed = isToolFailed(part.state);
						const showLine =
							index < parts.length - 1 || showFooter;

						return (
							<li
								key={`${name}-${index}`}
								className="relative flex gap-2.5 pb-2.5"
							>
								{showLine ? (
									<span
										aria-hidden
										className="absolute top-5 bottom-0 left-[9px] w-px bg-border"
									/>
								) : null}
								<span
									className={cn(
										"relative z-10 mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border bg-background text-[9px] font-semibold",
										failed
											? "border-destructive/40 text-destructive"
											: "border-border text-muted-foreground",
									)}
								>
									{running ? (
										<LoaderCircle className="size-2.5 animate-spin" />
									) : failed ? (
										<XIcon className="size-2.5" />
									) : (
										"P"
									)}
								</span>
								<span
									className={cn(
										"min-w-0 pt-px text-[13px] leading-5",
										failed
											? "text-destructive"
											: "text-muted-foreground",
									)}
								>
									{toolStepLabel(name)}
								</span>
							</li>
						);
					})}
					{allSettled ? (
						<li className="relative flex gap-2.5">
							<span
								className={cn(
									"relative z-10 mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border bg-background",
									hasFailure
										? "border-destructive/40 text-destructive"
										: "border-border text-foreground",
								)}
							>
								{hasFailure ? (
									<XIcon className="size-2.5" />
								) : (
									<Check
										className="size-2.5"
										strokeWidth={2.5}
									/>
								)}
							</span>
							<span
								className={cn(
									"pt-px text-[13px] leading-5",
									hasFailure
										? "text-destructive"
										: "text-foreground",
								)}
							>
								{hasFailure ? "Failed" : "Done"}
							</span>
						</li>
					) : anyRunning ? (
						<li className="relative flex gap-2.5">
							<span className="relative z-10 mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
								<LoaderCircle className="size-2.5 animate-spin" />
							</span>
							<span className="pt-px text-[13px] leading-5 text-muted-foreground">
								Working…
							</span>
						</li>
					) : null}
				</ol>
			</CollapsibleContent>
		</Collapsible>
	);
}

function assistantHasText(message: UIMessage) {
	return message.parts.some(
		(part) =>
			part.type === "text" &&
			typeof part.text === "string" &&
			part.text.trim().length > 0,
	);
}

function renderAssistantParts(message: UIMessage): ReactNode[] {
	const nodes: ReactNode[] = [];
	const toolParts = message.parts.filter(isChatToolPart);
	const historical = assistantHasText(message);

	if (toolParts.length > 0) {
		nodes.push(
			<ProfileToolActivity
				key={`${message.id}-tools`}
				parts={toolParts}
				startCollapsed={historical}
			/>,
		);
	}

	message.parts.forEach((part, index) => {
		if (part.type !== "text") {
			return;
		}
		if (typeof part.text !== "string" || part.text.trim().length === 0) {
			return;
		}
		nodes.push(
			<MessageResponse key={`${message.id}-text-${index}`}>
				{part.text}
			</MessageResponse>,
		);
	});

	return nodes;
}

function buildMessageWithContext(
	text: string,
	snippets: ProfileContextSnippet[],
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
			const name = getToolName(part);
			if (name !== "patch_profile" && name !== "update_profile") {
				continue;
			}
			if (part.state !== "output-available") {
				continue;
			}
			const output = part.output as
				| { ok?: boolean; profile?: string; applied?: number }
				| undefined;
			if (!output?.ok) {
				continue;
			}
			if (typeof output.profile === "string") {
				return { key: `${message.id}:${j}`, profile: output.profile };
			}
			return { key: `${message.id}:${j}`, profile: null };
		}
	}
	return null;
}

export function ProfileChat({
	threadId: threadIdProp,
	initialMessages = [],
	contextSnippets,
	onRemoveSnippet,
	onClearSnippets,
	onProfileUpdated,
	onNewChat,
	onOpenProfile,
	className,
}: ProfileChatProps) {
	const queryClient = useQueryClient();
	const { softReplace } = useSoftNav();
	const [text, setText] = useState("");
	const lastAppliedPatchKey = useRef<string | null>(null);
	const snippetsRef = useRef(contextSnippets);
	const threadIdRef = useRef(threadIdProp);
	const chatSessionId = useRef(threadIdProp ?? "profile-new");
	const prevStatusRef = useRef<string>("ready");

	useEffect(() => {
		snippetsRef.current = contextSnippets;
	}, [contextSnippets]);

	useEffect(() => {
		if (!threadIdProp) {
			return;
		}
		threadIdRef.current = threadIdProp;
		chatSessionId.current = threadIdProp;
	}, [threadIdProp]);

	const { messages, sendMessage, status, stop, error } = useChat({
		id: chatSessionId.current,
		messages: initialMessages,
		transport: new DefaultChatTransport({
			api: "/api/profile/chat",
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

		const timers = refreshProfileChatAfterTurn(queryClient, threadId);
		return () => {
			for (const timer of timers) {
				window.clearTimeout(timer);
			}
		};
	}, [queryClient, status]);

	useEffect(() => {
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

	const busy = status === "submitted" || status === "streaming";

	async function handleSubmit(message: PromptInputMessage) {
		const nextText = buildMessageWithContext(
			message.text,
			snippetsRef.current,
		);
		if (!nextText) {
			return;
		}

		const preview = nextText.replace(/\s+/g, " ").trim().slice(0, 160);
		const now = new Date().toISOString();

		if (!threadIdRef.current) {
			const newThreadId = nanoid();
			threadIdRef.current = newThreadId;
			softReplace(getProfileChatThreadHref(newThreadId));
			prependProfileChatThread(queryClient, {
				id: newThreadId,
				title: "New chat",
				preview,
				updatedAt: now,
			});
		} else {
			touchProfileChatThread(queryClient, threadIdRef.current, {
				preview: preview || undefined,
				updatedAt: now,
			});
		}

		setText("");
		onClearSnippets();
		await sendMessage({ text: nextText });
	}

	return (
		<div className={cn("flex min-h-0 flex-1 flex-col", className)}>
			<div className="flex shrink-0 items-center gap-2 border-b border-border/70 px-3 py-2">
				<p className="text-sm font-medium text-foreground">Chat</p>
				<div className="flex-1" />
				<Button
					type="button"
					variant="outline"
					size="icon-sm"
					className="size-8"
					aria-label="New chat"
					onClick={onNewChat}
					disabled={busy}
				>
					<Plus className="size-4" />
				</Button>
			</div>

			<Conversation className="min-h-0 flex-1">
				{messages.length === 0 ? (
					<ConversationEmptyState className="px-6">
						<div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-surface-subtle text-muted-foreground">
							<MessageSquareText className="size-5" />
						</div>
						<div className="max-w-[30ch] space-y-1.5">
							<h3 className="font-display text-lg font-semibold tracking-[-0.3px] text-foreground">
								Add to your profile
							</h3>
							<p className="text-sm leading-6 text-muted-foreground">
								Just say what to include, like a skill, a project,
								or a new role, and it lands in your document.
							</p>
						</div>
					</ConversationEmptyState>
				) : (
					<>
						<ConversationContent className="gap-4 px-4 py-4">
							{messages.map((message) => (
								<Message key={message.id} from={message.role}>
									<MessageContent>
										{message.role === "assistant"
											? renderAssistantParts(message)
											: message.parts.map(
													(part, index) => {
														if (
															part.type !== "text"
														) {
															return null;
														}
														return (
															<MessageResponse
																key={`${message.id}-${index}`}
															>
																{part.text}
															</MessageResponse>
														);
													},
												)}
									</MessageContent>
								</Message>
							))}
						</ConversationContent>
						<ConversationScrollButton />
					</>
				)}
			</Conversation>

			{error ? (
				<p className="px-4 pb-2 text-xs text-destructive">
					{error.message || "Something went wrong"}
				</p>
			) : null}

			<div className="shrink-0 border-t border-border p-3">
				{onOpenProfile ? (
					<button
						type="button"
						onClick={onOpenProfile}
						className="mb-2 flex w-full items-center gap-2 rounded-lg border border-border bg-surface-subtle px-2.5 py-1.5 text-left transition-colors hover:bg-muted/70"
					>
						<span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-white text-foreground dark:bg-background">
							<FileText className="size-3" />
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
								<button
									type="button"
									className="rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
									aria-label="Remove context"
									onClick={() => onRemoveSnippet(snippet.id)}
								>
									<XIcon className="size-3" />
								</button>
							</li>
						))}
					</ul>
				) : null}

				<PromptInput
					className="rounded-xl border border-border"
					onSubmit={handleSubmit}
				>
					<PromptInputBody>
						<PromptInputTextarea
							value={text}
							onChange={(event) => setText(event.target.value)}
							placeholder="Ask to edit your profile…"
							disabled={busy}
						/>
					</PromptInputBody>
					<PromptInputFooter>
						<div />
						<PromptInputSubmit
							status={status}
							onStop={stop}
							disabled={
								busy
									? false
									: !text.trim() &&
										contextSnippets.length === 0
							}
						/>
					</PromptInputFooter>
				</PromptInput>
			</div>
		</div>
	);
}
