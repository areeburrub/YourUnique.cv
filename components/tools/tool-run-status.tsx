"use client";

import { CheckIcon, CircleNotchIcon } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

export type ToolRunStatusStep = {
	id: string;
	label: string;
	state: "running" | "done" | "failed";
};

export function ToolRunStatus({ steps }: { steps: ToolRunStatusStep[] }) {
	if (steps.length === 0) {
		return null;
	}

	return (
		<ol className="mt-4 space-y-2" aria-live="polite">
			{steps.map((step) => (
				<li
					key={step.id}
					className="flex items-center gap-2 text-sm text-muted-foreground"
				>
					{step.state === "running" ? (
						<CircleNotchIcon
							size={16}
							className="animate-spin text-brand"
						/>
					) : step.state === "done" ? (
						<CheckIcon size={16} className="text-brand" weight="bold" />
					) : (
						<span className="size-4 text-destructive">×</span>
					)}
					<span
						className={cn(
							step.state === "running" && "text-foreground",
							step.state === "failed" && "text-destructive",
						)}
					>
						{step.label}
					</span>
				</li>
			))}
		</ol>
	);
}
