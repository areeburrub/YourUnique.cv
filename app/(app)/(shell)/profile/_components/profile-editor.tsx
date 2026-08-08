"use client";

import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";
import { Markdown } from "tiptap-markdown";

import { cn } from "@/lib/utils";

type ProfileEditorProps = {
	value: string;
	onChange: (markdown: string) => void;
	onSelectionChange?: (selection: {
		text: string;
		rect: DOMRect | null;
	}) => void;
	className?: string;
};

function getMarkdown(editor: { storage: unknown }) {
	const storage = editor.storage as {
		markdown?: { getMarkdown?: () => string };
	};
	return storage.markdown?.getMarkdown?.() ?? "";
}

export function ProfileEditor({
	value,
	onChange,
	onSelectionChange,
	className,
}: ProfileEditorProps) {
	const applyingExternal = useRef(false);
	const lastEmitted = useRef(value);

	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit.configure({
				heading: { levels: [2, 3] },
			}),
			Link.configure({
				openOnClick: false,
				autolink: true,
			}),
			Placeholder.configure({
				placeholder: "Start editing your career profile…",
			}),
			Markdown.configure({
				html: false,
				transformPastedText: true,
				transformCopiedText: true,
			}),
		],
		content: value,
		editorProps: {
			attributes: {
				class:
					"profile-editor-content min-h-full outline-none px-6 py-6 sm:px-8 sm:py-8",
				spellcheck: "false",
				autocorrect: "off",
				autocapitalize: "off",
			},
		},
		onUpdate: ({ editor: current }) => {
			if (applyingExternal.current) {
				return;
			}
			const markdown = getMarkdown(current);
			if (markdown === lastEmitted.current) {
				return;
			}
			lastEmitted.current = markdown;
			onChange(markdown);
		},
		onSelectionUpdate: ({ editor: current }) => {
			if (!onSelectionChange) {
				return;
			}
			const { from, to, empty } = current.state.selection;
			if (empty) {
				onSelectionChange({ text: "", rect: null });
				return;
			}
			const text = current.state.doc.textBetween(from, to, "\n").trim();
			if (!text) {
				onSelectionChange({ text: "", rect: null });
				return;
			}
			const coords = current.view.coordsAtPos(from);
			const rect = new DOMRect(
				coords.left,
				coords.top,
				Math.max(1, current.view.coordsAtPos(to).left - coords.left),
				Math.max(18, coords.bottom - coords.top),
			);
			onSelectionChange({ text, rect });
		},
	});

	useEffect(() => {
		if (!editor) {
			return;
		}
		const current = getMarkdown(editor);
		if (value === current || value === lastEmitted.current) {
			return;
		}
		applyingExternal.current = true;
		lastEmitted.current = value;
		editor.commands.setContent(value);
		queueMicrotask(() => {
			applyingExternal.current = false;
		});
	}, [editor, value]);

	if (!editor) {
		return (
			<div
				className={cn(
					"flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground",
					className,
				)}
			>
				Loading editor…
			</div>
		);
	}

	return (
		<div className={cn("flex min-h-0 flex-1 flex-col", className)}>
			<div className="min-h-0 flex-1 overflow-y-auto">
				<EditorContent editor={editor} className="h-full" />
			</div>
		</div>
	);
}
