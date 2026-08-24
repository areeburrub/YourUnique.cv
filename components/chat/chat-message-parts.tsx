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
import { ResumePdfCard } from "@/components/chat/resume-pdf-card";
import {
	agentDataPartsFromMessage,
	collectAssistantActivitySteps,
	isInternalToolName,
	resumeOutputsFromAgentData,
	runningActivityStatusLabel,
	runningToolStatusLabel,
	ToolActivity,
} from "@/components/chat/tool-activity";
import { fileTypeLabel } from "@/lib/file-type";
import {
	isResumePdfCardTool,
	resumeIdFromDownloadUrl,
	type ResumeListItem,
} from "@/lib/resumes";
export { isInternalToolName };

export function isChatToolPart(
	part: unknown,
): part is ToolUIPart | DynamicToolUIPart {
	return isToolUIPart(part as never);
}

export function isVisibleChatToolPart(
	part: unknown,
): part is ToolUIPart | DynamicToolUIPart {
	if (!isChatToolPart(part)) {
		return false;
	}
	return !isInternalToolName(getToolName(part));
}

export function getAssistantToolStatusLabel(
	message: UIMessage,
	options?: { streamActive?: boolean },
) {
	const activitySteps = collectAssistantActivitySteps(message, options);
	const fromSteps = runningActivityStatusLabel(activitySteps);
	if (fromSteps) {
		return fromSteps;
	}

	if (options?.streamActive === false) {
		return null;
	}

	const toolParts = message.parts.filter(isChatToolPart);
	return runningToolStatusLabel(toolParts);
}

export function assistantHasVisibleActivity(
	message: UIMessage,
	options?: { streamActive?: boolean },
) {
	return collectAssistantActivitySteps(message, options).length > 0;
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

export function UserMessage({ message }: { message: UIMessage }) {
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

function resumeCardFromOutput(output: unknown) {
	if (!output || typeof output !== "object") {
		return null;
	}
	const record = output as Record<string, unknown>;
	const previewUrl =
		typeof record.previewUrl === "string"
			? record.previewUrl
			: typeof record.downloadUrl === "string"
				? record.downloadUrl.replace(/\?download=1$/, "")
				: null;
	const downloadUrl =
		typeof record.downloadUrl === "string"
			? record.downloadUrl
			: previewUrl
				? `${previewUrl}${previewUrl.includes("?") ? "&" : "?"}download=1`
				: null;
	const resumeName =
		typeof record.name === "string" && record.name.trim()
			? record.name
			: "Resume";
	const compileStatus = (
		typeof record.compileStatus === "string"
			? record.compileStatus
			: undefined
	) as ResumeListItem["compileStatus"] | undefined;

	if (!previewUrl || !downloadUrl) {
		return null;
	}

	return {
		name: resumeName,
		previewUrl,
		downloadUrl,
		compileStatus,
		familyId:
			typeof record.familyId === "string" && record.familyId
				? record.familyId
				: resumeIdFromDownloadUrl(previewUrl) ?? previewUrl,
	};
}

function resumeCardFromToolPart(part: ToolUIPart | DynamicToolUIPart) {
	const name = getToolName(part);
	if (!isResumePdfCardTool(name)) {
		return null;
	}
	if (part.state !== "output-available") {
		return null;
	}
	return resumeCardFromOutput(part.output);
}

function resumeCardsFromAgentToolOutput(part: ToolUIPart | DynamicToolUIPart) {
	if (part.state !== "output-available" || !part.output || typeof part.output !== "object") {
	return [] as Array<{
		name: string;
		previewUrl: string;
		downloadUrl: string;
		compileStatus?: ResumeListItem["compileStatus"];
		familyId: string;
	}>;
	}
	const output = part.output as {
		subAgentToolResults?: Array<{
			toolName?: string;
			result?: unknown;
			isError?: boolean;
		}>;
	};
	if (!Array.isArray(output.subAgentToolResults)) {
		return [];
	}

	const cards = [];
	for (const result of output.subAgentToolResults) {
		if (
			result.isError ||
			!result.toolName ||
			!isResumePdfCardTool(result.toolName)
		) {
			continue;
		}
		const card = resumeCardFromOutput(result.result);
		if (card) {
			cards.push(card);
		}
	}
	return cards;
}

export function renderAssistantParts(
	message: UIMessage,
	options?: { streamActive?: boolean },
): ReactNode[] {
	const nodes: ReactNode[] = [];
	const activitySteps = collectAssistantActivitySteps(message, options);
	const historical = assistantHasText(message);

	if (activitySteps.length > 0) {
		nodes.push(
			<ToolActivity
				key={`${message.id}-tools`}
				steps={activitySteps}
				startCollapsed={historical}
			/>,
		);
	}

	const cards: Array<{
		name: string;
		previewUrl: string;
		downloadUrl: string;
		compileStatus?: ResumeListItem["compileStatus"];
		familyId: string;
	}> = [];

	const collectCard = (
		card: {
			name: string;
			previewUrl: string;
			downloadUrl: string;
			compileStatus?: ResumeListItem["compileStatus"];
			familyId: string;
		} | null,
	) => {
		if (!card) {
			return;
		}
		cards.push(card);
	};

	for (const part of message.parts) {
		if (!isChatToolPart(part)) {
			continue;
		}
		collectCard(resumeCardFromToolPart(part));
		for (const card of resumeCardsFromAgentToolOutput(part)) {
			collectCard(card);
		}
	}

	for (const part of agentDataPartsFromMessage(message)) {
		for (const output of resumeOutputsFromAgentData(part.data)) {
			collectCard(resumeCardFromOutput(output));
		}
	}

	const latestByFamily = new Map<string, (typeof cards)[number]>();
	for (const card of cards) {
		latestByFamily.set(card.familyId, card);
	}
	const seenFamilies = new Set<string>();
	for (const card of cards) {
		if (seenFamilies.has(card.familyId)) {
			continue;
		}
		seenFamilies.add(card.familyId);
		const latest = latestByFamily.get(card.familyId) ?? card;
		nodes.push(
			<ResumePdfCard
				key={`${message.id}-resume-${latest.familyId}`}
				name={latest.name}
				previewUrl={latest.previewUrl}
				downloadUrl={latest.downloadUrl}
				compileStatus={latest.compileStatus}
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
