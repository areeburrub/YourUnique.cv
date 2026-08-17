"use client";

import type { AgentDataPart } from "@mastra/ai-sdk";
import {
	getToolName,
	type DynamicToolUIPart,
	type ToolUIPart,
	type UIMessage,
} from "ai";
import { CaretDownIcon, CheckIcon, CircleNotchIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	CHAT_ACTIVITY_PLANNING_STEP_ID,
	isChatActivityPart,
	isInternalToolName,
	toolStepLabel,
	type ChatActivityStep,
} from "@/lib/chat-activity";
import { isResumePdfCardTool } from "@/lib/resumes";
import { cn } from "@/lib/utils";

export type ActivityStepState = ChatActivityStep["state"];
export type ActivityStep = {
	id: string;
	name: string;
	state: ActivityStepState;
	label?: string;
};

export { isInternalToolName, toolStepLabel };

export function isToolRunning(state: ToolUIPart["state"]) {
	return (
		state === "input-streaming" ||
		state === "input-available" ||
		state === "approval-requested"
	);
}

function isToolFailed(state: ToolUIPart["state"]) {
	return state === "output-error" || state === "output-denied";
}

function activityStateFromToolPart(
	state: ToolUIPart["state"],
): ActivityStepState {
	if (isToolFailed(state)) {
		return "failed";
	}
	if (isToolRunning(state)) {
		return "running";
	}
	return "done";
}

function pushUniqueStep(steps: ActivityStep[], step: ActivityStep) {
	const existing = steps.find((item) => item.id === step.id);
	if (!existing) {
		steps.push(step);
		return;
	}
	existing.name = step.name || existing.name;
	existing.label = step.label || existing.label;
	if (step.state === "failed") {
		existing.state = "failed";
		return;
	}
	if (existing.state === "failed") {
		return;
	}
	if (step.state === "done" || existing.state === "running") {
		existing.state = step.state;
	}
}

type LooseToolRef = {
	toolCallId?: string;
	toolName?: string;
	result?: unknown;
	isError?: boolean;
	payload?: {
		toolCallId?: string;
		toolName?: string;
		result?: unknown;
		isError?: boolean;
	};
};

function refId(ref: LooseToolRef | undefined) {
	return ref?.toolCallId || ref?.payload?.toolCallId;
}

function refName(ref: LooseToolRef | undefined) {
	return ref?.toolName || ref?.payload?.toolName;
}

function refError(ref: LooseToolRef | undefined) {
	return Boolean(ref?.isError ?? ref?.payload?.isError);
}

function refResult(ref: LooseToolRef | undefined) {
	return ref?.result ?? ref?.payload?.result;
}

export function isAgentDataPart(part: unknown): part is AgentDataPart {
	return (
		typeof part === "object" &&
		part !== null &&
		"type" in part &&
		(part as { type: unknown }).type === "data-tool-agent" &&
		"data" in part
	);
}

function collectStepsFromAgentSlice(
	slice: {
		toolCalls?: LooseToolRef[];
		toolResults?: LooseToolRef[];
		pendingToolCalls?: LooseToolRef[];
	},
	into: ActivityStep[],
) {
	for (const call of slice.toolCalls ?? []) {
		const toolCallId = refId(call);
		const toolName = refName(call);
		if (!toolCallId || !toolName || isInternalToolName(toolName)) {
			continue;
		}
		const result = (slice.toolResults ?? []).find(
			(item) => refId(item) === toolCallId,
		);
		pushUniqueStep(into, {
			id: toolCallId,
			name: toolName,
			state: result
				? refError(result)
					? "failed"
					: "done"
				: "running",
		});
	}

	for (const pending of slice.pendingToolCalls ?? []) {
		const toolCallId = refId(pending);
		const toolName = refName(pending);
		if (!toolCallId || !toolName || isInternalToolName(toolName)) {
			continue;
		}
		pushUniqueStep(into, {
			id: toolCallId,
			name: toolName,
			state: "running",
		});
	}

	for (const result of slice.toolResults ?? []) {
		const toolCallId = refId(result);
		const toolName = refName(result);
		if (!toolCallId || !toolName || isInternalToolName(toolName)) {
			continue;
		}
		pushUniqueStep(into, {
			id: toolCallId,
			name: toolName,
			state: refError(result) ? "failed" : "done",
		});
	}
}

export function activityStepsFromAgentData(data: unknown): ActivityStep[] {
	const activity = data as {
		steps?: Array<{
			toolCalls?: LooseToolRef[];
			toolResults?: LooseToolRef[];
			pendingToolCalls?: LooseToolRef[];
		}>;
		toolCalls?: LooseToolRef[];
		toolResults?: LooseToolRef[];
		pendingToolCalls?: LooseToolRef[];
	};
	const steps: ActivityStep[] = [];
	for (const completed of activity.steps ?? []) {
		collectStepsFromAgentSlice(completed, steps);
	}
	collectStepsFromAgentSlice(activity, steps);
	return steps;
}

export function agentDataPartsFromMessage(message: UIMessage) {
	return message.parts.filter(isAgentDataPart);
}

function stepsFromSubAgentToolResults(
	part: ToolUIPart | DynamicToolUIPart,
): ActivityStep[] {
	if (
		part.state !== "output-available" ||
		!part.output ||
		typeof part.output !== "object"
	) {
		return [];
	}
	const output = part.output as {
		subAgentToolResults?: Array<{
			toolCallId?: string;
			toolName?: string;
			isError?: boolean;
		}>;
	};
	if (!Array.isArray(output.subAgentToolResults)) {
		return [];
	}

	return output.subAgentToolResults.flatMap((result, index) => {
		if (!result.toolName || isInternalToolName(result.toolName)) {
			return [];
		}
		return [
			{
				id: result.toolCallId || `${getToolName(part)}-nested-${index}`,
				name: result.toolName,
				state: (result.isError ? "failed" : "done") as ActivityStepState,
			},
		];
	});
}

function messageToolParts(message: UIMessage) {
	return message.parts.filter(
		(part): part is ToolUIPart | DynamicToolUIPart =>
			typeof part === "object" &&
			part !== null &&
			"type" in part &&
			(String((part as { type: unknown }).type).startsWith("tool-") ||
				(part as { type: unknown }).type === "dynamic-tool"),
	);
}

function messageHasAssistantText(message: UIMessage) {
	return message.parts.some(
		(part) =>
			part.type === "text" &&
			"text" in part &&
			typeof part.text === "string" &&
			part.text.trim().length > 0,
	);
}

export type CollectActivityOptions = {
	/** False once useChat is no longer submitted/streaming for this turn. */
	streamActive?: boolean;
};

/**
 * Drop stale "Learning about you…" planning rows after the agent tool has
 * already finished (or the assistant already replied). The stream transform
 * should clear these; this covers persisted / mid-error leftovers.
 */
function reconcileActivitySteps(
	steps: ActivityStep[],
	message: UIMessage,
	options?: CollectActivityOptions,
): ActivityStep[] {
	const streamActive = options?.streamActive ?? true;
	const toolParts = messageToolParts(message);
	const anyToolRunning = toolParts.some((part) => isToolRunning(part.state));
	const agentToolSettled = toolParts.some(
		(part) =>
			isInternalToolName(getToolName(part)) && !isToolRunning(part.state),
	);
	const settlePlanning =
		!streamActive ||
		(!anyToolRunning &&
			(agentToolSettled || messageHasAssistantText(message)));

	const next: ActivityStep[] = [];
	for (const step of steps) {
		if (step.id === CHAT_ACTIVITY_PLANNING_STEP_ID) {
			if (step.state === "running" && settlePlanning) {
				continue;
			}
			next.push(step);
			continue;
		}

		const tool = toolParts.find((part) => part.toolCallId === step.id);
		if (tool && step.state === "running") {
			next.push({
				...step,
				state: activityStateFromToolPart(tool.state),
			});
			continue;
		}
		if (step.state === "running" && !streamActive) {
			next.push({ ...step, state: "done" });
			continue;
		}
		next.push(step);
	}
	return next;
}

export function collectAssistantActivitySteps(
	message: UIMessage,
	options?: CollectActivityOptions,
): ActivityStep[] {
	const steps: ActivityStep[] = [];

	for (const part of message.parts) {
		if (!isChatActivityPart(part)) {
			continue;
		}
		for (const step of part.data.steps ?? []) {
			pushUniqueStep(steps, {
				id: step.id,
				name: step.name,
				label: step.label,
				state: step.state,
			});
		}
	}

	if (steps.length > 0) {
		return reconcileActivitySteps(steps, message, options);
	}

	const toolParts = messageToolParts(message);

	for (const part of toolParts) {
		const name = getToolName(part);
		const nested = stepsFromSubAgentToolResults(part);
		if (nested.length > 0) {
			for (const step of nested) {
				pushUniqueStep(steps, step);
			}
			continue;
		}
		if (isInternalToolName(name) && isToolRunning(part.state)) {
			pushUniqueStep(steps, {
				id: part.toolCallId || name,
				name,
				state: "running",
			});
			continue;
		}
		if (!isInternalToolName(name)) {
			pushUniqueStep(steps, {
				id: part.toolCallId || name,
				name,
				state: activityStateFromToolPart(part.state),
			});
		}
	}

	for (const part of agentDataPartsFromMessage(message)) {
		for (const step of activityStepsFromAgentData(part.data)) {
			pushUniqueStep(steps, step);
		}
	}

	const leafSteps = steps.filter((step) => !isInternalToolName(step.name));
	return leafSteps.length > 0 ? leafSteps : steps;
}

export function runningActivityStatusLabel(steps: ActivityStep[]) {
	for (let i = steps.length - 1; i >= 0; i -= 1) {
		const step = steps[i];
		if (!step || step.state !== "running") {
			continue;
		}
		const label = step.label || toolStepLabel(step.name);
		return label.endsWith("…") || label.endsWith("...")
			? label
			: `${label}…`;
	}
	return null;
}

export function runningToolStatusLabel(
	parts: Array<ToolUIPart | DynamicToolUIPart>,
) {
	for (let i = parts.length - 1; i >= 0; i -= 1) {
		const part = parts[i];
		if (!part || !isToolRunning(part.state)) {
			continue;
		}
		const label = toolStepLabel(getToolName(part));
		return label.endsWith("…") || label.endsWith("...")
			? label
			: `${label}…`;
	}
	return null;
}

export function resumeOutputsFromAgentData(data: unknown) {
	const activity = data as {
		steps?: Array<{ toolResults?: LooseToolRef[] }>;
		toolResults?: LooseToolRef[];
	};
	const outputs: unknown[] = [];
	const collect = (slice: { toolResults?: LooseToolRef[] }) => {
		for (const result of slice.toolResults ?? []) {
			const name = refName(result);
			if (!name || !isResumePdfCardTool(name)) {
				continue;
			}
			if (refError(result)) {
				continue;
			}
			outputs.push(refResult(result));
		}
	};

	for (const completed of activity.steps ?? []) {
		collect(completed);
	}
	collect(activity);
	return outputs;
}

type ToolActivityProps = {
	steps: ActivityStep[];
	label?: string;
	startCollapsed?: boolean;
};

function ActivityStepRow({
	step,
	showLine = false,
}: {
	step: ActivityStep;
	showLine?: boolean;
}) {
	const running = step.state === "running";
	const failed = step.state === "failed";
	const text = step.label || toolStepLabel(step.name);

	return (
		<div className="relative flex gap-2.5 pb-2.5 last:pb-0">
			{showLine ? (
				<span
					aria-hidden
					className="absolute top-5 bottom-0 left-[9px] w-px bg-border"
				/>
			) : null}
			<span
				className={cn(
					"relative z-10 mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border bg-background",
					failed
						? "border-destructive/40 text-destructive"
						: running
							? "border-border text-muted-foreground"
							: "border-border text-foreground",
				)}
			>
				{running ? (
					<CircleNotchIcon size={10} className="animate-spin" />
				) : failed ? (
					<XIcon size={10} weight="bold" />
				) : (
					<CheckIcon size={10} weight="bold" />
				)}
			</span>
			<span
				className={cn(
					"min-w-0 pt-px text-[13px] leading-5",
					failed
						? "text-destructive"
						: running
							? "text-foreground"
							: "text-muted-foreground",
				)}
			>
				{text}
				{running ? "…" : ""}
			</span>
		</div>
	);
}

export function ToolActivity({
	steps,
	label = "Working on it",
	startCollapsed = false,
}: ToolActivityProps) {
	const allSettled =
		steps.length > 0 &&
		steps.every((step) => step.state === "done" || step.state === "failed");
	const hasFailure = steps.some((step) => step.state === "failed");
	const anyRunning = steps.some((step) => step.state === "running");
	const activeLabel = runningActivityStatusLabel(steps);
	const [open, setOpen] = useState(() => !allSettled || !startCollapsed);

	useEffect(() => {
		if (!allSettled) {
			setOpen(true);
			return;
		}
		if (!startCollapsed) {
			return;
		}
		const timer = window.setTimeout(() => setOpen(false), 900);
		return () => window.clearTimeout(timer);
	}, [allSettled, startCollapsed]);

	if (steps.length === 0) {
		return null;
	}

	if (steps.length === 1 && steps[0]) {
		return <ActivityStepRow step={steps[0]} />;
	}

	const triggerLabel = anyRunning
		? activeLabel || label
		: allSettled
			? hasFailure
				? "Some steps failed"
				: `${steps.length} steps completed`
			: label;

	return (
		<Collapsible
			open={open}
			onOpenChange={setOpen}
			className="w-full max-w-full"
		>
			<CollapsibleTrigger className="flex items-center gap-1.5 text-[13px] leading-5 text-muted-foreground transition-colors hover:text-foreground">
				{anyRunning ? (
					<CircleNotchIcon size={14} className="animate-spin" />
				) : null}
				<span>{triggerLabel}</span>
				<CaretDownIcon
					size={14}
					weight="bold"
					className={cn(
						"transition-transform",
						open && "rotate-180",
					)}
				/>
			</CollapsibleTrigger>
			<CollapsibleContent className="overflow-hidden">
				<ol className="mt-2 flex flex-col">
					{steps.map((step, index) => (
						<li key={step.id}>
							<ActivityStepRow
								step={step}
								showLine={index < steps.length - 1}
							/>
						</li>
					))}
				</ol>
			</CollapsibleContent>
		</Collapsible>
	);
}
