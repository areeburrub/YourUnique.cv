"use client";

import {
	getToolName,
	type DynamicToolUIPart,
	type ToolUIPart,
} from "ai";
import { Check, ChevronDown, LoaderCircle, XIcon } from "lucide-react";
import { useEffect, useState } from "react";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const toolTitles: Record<string, string> = {
	"name-chat": "Naming chat",
	nameChatTool: "Naming chat",
	save_onboarding_context: "Saving your profile",
	"agent-onboardingAgent": "Onboarding",
	"agent-resumeAgent": "Resume help",
	"agent-profileEditAgent": "Updating your profile",
	onboardingAgent: "Onboarding",
	resumeAgent: "Resume help",
	profileEditAgent: "Updating your profile",
	patch_profile: "Updating your profile",
	update_profile: "Updating your profile",
	get_profile: "Reading your profile",
};

export function toolStepLabel(name: string) {
	if (toolTitles[name]) {
		return toolTitles[name];
	}

	const agentMatch = name.match(/^(?:agent-)?(.+?)(?:Agent)?$/);
	const agentKey = agentMatch?.[1];
	if (agentKey && toolTitles[`${agentKey}Agent`]) {
		return toolTitles[`${agentKey}Agent`];
	}
	if (agentKey && toolTitles[agentKey]) {
		return toolTitles[agentKey];
	}

	return name
		.replace(/^agent-/, "")
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace(/[-_]/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

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

function isToolDone(state: ToolUIPart["state"]) {
	return state === "output-available";
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

type ToolActivityProps = {
	parts: Array<ToolUIPart | DynamicToolUIPart>;
	label?: string;
	badge?: string;
	startCollapsed?: boolean;
};

export function ToolActivity({
	parts,
	label = "Used tools",
	badge = "·",
	startCollapsed = false,
}: ToolActivityProps) {
	const allSettled = parts.every(
		(part) => isToolDone(part.state) || isToolFailed(part.state),
	);
	const hasFailure = parts.some((part) => isToolFailed(part.state));
	const anyRunning = parts.some((part) => isToolRunning(part.state));
	const activeLabel = runningToolStatusLabel(parts);
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
	const triggerLabel = anyRunning && activeLabel ? activeLabel : label;

	return (
		<Collapsible
			open={open}
			onOpenChange={setOpen}
			className="w-full max-w-full"
		>
			<CollapsibleTrigger className="flex items-center gap-1 text-[13px] leading-5 text-muted-foreground transition-colors hover:text-foreground">
				<span>{triggerLabel}</span>
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
										badge
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
