"use client";

import {
	getToolName,
	isToolUIPart,
	type DynamicToolUIPart,
	type FileUIPart,
	type ToolUIPart,
	type UIMessage,
} from "ai";
import type { ReactNode } from "react";

import { MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
	runningToolStatusLabel,
	ToolActivity,
} from "@/components/chat/tool-activity";
import { fileTypeLabel } from "@/lib/file-type";
import { isOnboardingKickoffMessage } from "@/lib/onboarding-kickoff";

export function isChatToolPart(
	part: unknown,
): part is ToolUIPart | DynamicToolUIPart {
	return isToolUIPart(part as never);
}

export function isInternalToolName(name: string) {
	return (
		name.startsWith("agent-") ||
		name.endsWith("Agent") ||
		name === "onboardingAgent" ||
		name === "resumeAgent" ||
		name === "profileEditAgent" ||
		name === "appAgent"
	);
}

export function isVisibleChatToolPart(
	part: unknown,
): part is ToolUIPart | DynamicToolUIPart {
	if (!isChatToolPart(part)) {
		return false;
	}
	return !isInternalToolName(getToolName(part));
}

export function getAssistantToolStatusLabel(message: UIMessage) {
	const toolParts = message.parts.filter(isChatToolPart);
	return runningToolStatusLabel(toolParts);
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

export function ChatThinking({ label = "Thinking" }: { label?: string }) {
	return (
		<div className="flex items-center gap-2.5 text-muted-foreground">
			<ThinkingDots />
			<span className="text-sm">{label}</span>
		</div>
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

export function MessageFilePart({
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

export function isHiddenUserMessage(message: UIMessage) {
	if (message.role !== "user") {
		return false;
	}
	const fileParts = message.parts.filter((part) => part.type === "file");
	if (fileParts.length > 0) {
		return false;
	}
	const text = message.parts
		.filter(
			(part): part is { type: "text"; text: string } =>
				part.type === "text" && typeof part.text === "string",
		)
		.map((part) => part.text)
		.join("\n")
		.trim();
	return isOnboardingKickoffMessage(text);
}

export function UserMessage({ message }: { message: UIMessage }) {
	if (isHiddenUserMessage(message)) {
		return null;
	}

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

function assistantHasText(message: UIMessage) {
	return message.parts.some(
		(part) =>
			part.type === "text" &&
			typeof part.text === "string" &&
			part.text.trim().length > 0,
	);
}

export function renderAssistantParts(
	message: UIMessage,
	options?: {
		toolLabel?: string;
		toolBadge?: string;
	},
): ReactNode[] {
	const nodes: ReactNode[] = [];
	const toolParts = message.parts.filter(isVisibleChatToolPart);
	const historical = assistantHasText(message);

	if (toolParts.length > 0) {
		nodes.push(
			<ToolActivity
				key={`${message.id}-tools`}
				parts={toolParts}
				label={options?.toolLabel}
				badge={options?.toolBadge}
				startCollapsed={historical}
			/>,
		);
	}

	message.parts.forEach((part, index) => {
		if (part.type === "file") {
			nodes.push(
				<MessageFilePart
					key={`${message.id}-file-${index}`}
					part={part}
					messageId={message.id}
					index={index}
				/>,
			);
			return;
		}
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
