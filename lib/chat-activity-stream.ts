import type { UIMessageChunk } from "ai";

import {
	isInternalToolName,
	toolStepLabel,
	type ChatActivityData,
	type ChatActivityStep,
	type ChatActivityStepState,
} from "@/lib/chat-activity";

type LooseRecord = Record<string, unknown>;

function asRecord(value: unknown): LooseRecord | null {
	if (!value || typeof value !== "object") {
		return null;
	}
	return value as LooseRecord;
}

function readString(value: unknown) {
	return typeof value === "string" && value.trim() ? value : null;
}

function toolRefFromUnknown(value: unknown): {
	id: string;
	name: string;
	failed?: boolean;
	hasResult?: boolean;
} | null {
	const record = asRecord(value);
	if (!record) {
		return null;
	}
	const nested = asRecord(record.payload);
	const id = readString(record.toolCallId) || readString(nested?.toolCallId);
	const name = readString(record.toolName) || readString(nested?.toolName);
	if (!id || !name) {
		return null;
	}
	const failed = Boolean(record.isError ?? nested?.isError ?? false);
	const hasResult =
		"result" in record ||
		(nested !== null && "result" in nested) ||
		failed;
	return { id, name, failed, hasResult };
}

function upsertStep(
	steps: Map<string, ChatActivityStep>,
	step: {
		id: string;
		name: string;
		state: ChatActivityStepState;
	},
) {
	if (isInternalToolName(step.name)) {
		return;
	}
	const existing = steps.get(step.id);
	const next: ChatActivityStep = {
		...step,
		label: toolStepLabel(step.name),
	};
	if (!existing) {
		steps.set(step.id, next);
		return;
	}
	if (step.state === "failed" || existing.state === "running") {
		existing.state = step.state;
	} else if (existing.state !== "failed") {
		existing.state = step.state;
	}
	existing.name = step.name;
	existing.label = next.label;
}

function collectFromAgentData(
	data: unknown,
	steps: Map<string, ChatActivityStep>,
) {
	const root = asRecord(data);
	if (!root) {
		return;
	}

	const visitSlice = (slice: unknown) => {
		const record = asRecord(slice);
		if (!record) {
			return;
		}

		const results = (
			Array.isArray(record.toolResults) ? record.toolResults : []
		)
			.map(toolRefFromUnknown)
			.filter(Boolean) as Array<{
			id: string;
			name: string;
			failed?: boolean;
		}>;

		for (const call of Array.isArray(record.toolCalls)
			? record.toolCalls
			: []) {
			const ref = toolRefFromUnknown(call);
			if (!ref) {
				continue;
			}
			const result = results.find((item) => item.id === ref.id);
			upsertStep(steps, {
				id: ref.id,
				name: ref.name,
				state: result
					? result.failed
						? "failed"
						: "done"
					: "running",
			});
		}

		for (const pending of Array.isArray(record.pendingToolCalls)
			? record.pendingToolCalls
			: []) {
			const ref = toolRefFromUnknown(pending);
			if (!ref) {
				continue;
			}
			upsertStep(steps, {
				id: ref.id,
				name: ref.name,
				state: "running",
			});
		}

		for (const result of results) {
			upsertStep(steps, {
				id: result.id,
				name: result.name,
				state: result.failed ? "failed" : "done",
			});
		}
	};

	for (const completed of Array.isArray(root.steps) ? root.steps : []) {
		visitSlice(completed);
	}
	visitSlice(root);
}

/**
 * Builds a stable, human-readable activity feed from Mastra/AI SDK UI stream
 * chunks (top-level tools + nested data-tool-agent snapshots).
 */
const PLANNING_STEP_ID = "__planning";

type ActivityStreamChunk = UIMessageChunk;

export function createChatActivityTransform() {
	const steps = new Map<string, ChatActivityStep>();

	const clearPlanning = () => {
		steps.delete(PLANNING_STEP_ID);
	};

	const ensurePlanning = (agentName: string) => {
		if ([...steps.keys()].some((id) => id !== PLANNING_STEP_ID)) {
			return;
		}
		steps.set(PLANNING_STEP_ID, {
			id: PLANNING_STEP_ID,
			name: agentName,
			label: toolStepLabel(agentName),
			state: "running",
		});
	};

	const publish = (
		controller: TransformStreamDefaultController<ActivityStreamChunk>,
	) => {
		if (steps.size === 0) {
			return;
		}
		controller.enqueue({
			type: "data-chat-activity",
			id: "chat-activity",
			data: {
				steps: Array.from(steps.values()),
			} satisfies ChatActivityData,
		} as ActivityStreamChunk);
	};

	return new TransformStream<ActivityStreamChunk, ActivityStreamChunk>({
		transform(chunk, controller) {
			controller.enqueue(chunk);

			const part = asRecord(chunk);
			if (!part || typeof part.type !== "string") {
				return;
			}

			if (
				part.type === "tool-input-start" ||
				part.type === "tool-input-available"
			) {
				const id = readString(part.toolCallId);
				const name = readString(part.toolName);
				if (id && name && !isInternalToolName(name)) {
					clearPlanning();
					upsertStep(steps, {
						id,
						name,
						state: "running",
					});
					publish(controller);
				} else if (id && name && isInternalToolName(name)) {
					ensurePlanning(name);
					publish(controller);
				}
				return;
			}

			if (part.type === "tool-output-available") {
				const id = readString(part.toolCallId);
				if (id && steps.has(id)) {
					upsertStep(steps, {
						id,
						name: steps.get(id)!.name,
						state: "done",
					});
				}

				const output = asRecord(part.output);
				const nested = output?.subAgentToolResults;
				if (Array.isArray(nested)) {
					for (const item of nested) {
						const ref = toolRefFromUnknown(item);
						if (!ref) {
							continue;
						}
						upsertStep(steps, {
							id: ref.id,
							name: ref.name,
							state: ref.failed ? "failed" : "done",
						});
					}
				}
				publish(controller);
				return;
			}

			if (part.type === "tool-output-error") {
				const id = readString(part.toolCallId);
				if (id && steps.has(id)) {
					upsertStep(steps, {
						id,
						name: steps.get(id)!.name,
						state: "failed",
					});
					publish(controller);
				}
				return;
			}

			if (part.type === "data-tool-agent") {
				collectFromAgentData(part.data, steps);
				if (
					[...steps.keys()].some((id) => id !== PLANNING_STEP_ID)
				) {
					clearPlanning();
				}
				publish(controller);
			}
		},
	});
}
