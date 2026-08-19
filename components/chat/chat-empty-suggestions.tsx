"use client";

import {
	BriefcaseIcon,
	MagnifyingGlassIcon,
	UserPlusIcon,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";

import { cn } from "@/lib/utils";

type SuggestionIcon = ComponentType<{
	size?: number;
	weight?: "duotone";
	className?: string;
}>;

type ChatPromptSuggestion = {
	id: string;
	label: string;
	prompt: string;
	icon: SuggestionIcon;
};

export const CHAT_EMPTY_SUGGESTIONS: ChatPromptSuggestion[] = [
	{
		id: "tailor",
		label: "Tailor a resume",
		icon: BriefcaseIcon,
		prompt: `Tailor a resume for this job.

Role: [role]
Company: [company]
Job description:
[paste the posting or a job URL]`,
	},
	{
		id: "add-profile",
		label: "Add to my profile",
		icon: UserPlusIcon,
		prompt: `Add this to my profile:

[a skill, project, role, education, or anything else]`,
	},
	{
		id: "review",
		label: "Review my resume",
		icon: MagnifyingGlassIcon,
		prompt: `Review my resume for a [target role]. Tell me what's weak and what to change.`,
	},
];

export function selectPromptPlaceholder(
	el: HTMLTextAreaElement,
	value: string,
) {
	el.focus();
	const match = /\[[^\]]+\]/.exec(value);
	if (match) {
		el.setSelectionRange(match.index, match.index + match[0].length);
		return;
	}
	el.setSelectionRange(value.length, value.length);
}

export function ChatEmptySuggestions({
	onSelect,
	disabled = false,
	className,
}: {
	onSelect: (prompt: string) => void;
	disabled?: boolean;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"grid w-full grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-center",
				className,
			)}
			role="group"
			aria-label="Suggested prompts"
		>
			{CHAT_EMPTY_SUGGESTIONS.map((suggestion) => {
				const Icon = suggestion.icon;
				return (
					<button
						key={suggestion.id}
						type="button"
						disabled={disabled}
						onClick={() => onSelect(suggestion.prompt)}
						className="inline-flex h-11 w-full items-center gap-2 rounded-full border border-border/70 bg-card px-3.5 text-left text-sm text-foreground shadow-sm outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 sm:h-9 sm:w-auto"
					>
						<Icon
							size={16}
							weight="duotone"
							className="shrink-0 text-muted-foreground"
						/>
						<span className="min-w-0 truncate">{suggestion.label}</span>
					</button>
				);
			})}
		</div>
	);
}
