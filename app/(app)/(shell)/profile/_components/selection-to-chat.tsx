"use client";

import { MessageSquarePlus } from "lucide-react";

import { Button } from "@/components/ui/button";

type SelectionToChatProps = {
	text: string;
	rect: DOMRect | null;
	containerRect: DOMRect | null;
	onAdd: (text: string) => void;
};

export function SelectionToChat({
	text,
	rect,
	containerRect,
	onAdd,
}: SelectionToChatProps) {
	if (!text || !rect || !containerRect) {
		return null;
	}

	const top = Math.max(8, rect.top - containerRect.top - 42);
	const left = Math.min(
		Math.max(8, rect.left - containerRect.left),
		Math.max(8, containerRect.width - 140),
	);

	return (
		<div
			className="pointer-events-none absolute z-20"
			style={{ top, left }}
		>
			<Button
				type="button"
				size="sm"
				variant="secondary"
				className="pointer-events-auto shadow-md"
				onMouseDown={(event) => {
					event.preventDefault();
					onAdd(text);
				}}
			>
				<MessageSquarePlus className="size-3.5" />
				Add to chat
			</Button>
		</div>
	);
}
