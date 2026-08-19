"use client";

import { PencilSimpleIcon, PlusIcon, SlidersHorizontalIcon, TrashIcon } from "@phosphor-icons/react";
import { type Dispatch, type SetStateAction, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ResumeStyleItem, ResumeStyleMemory } from "@/lib/resume-style";

type EditorState = {
	id?: string;
	title: string;
	instruction: string;
};

type StyleMemoryPanelProps = {
	initialStyle: ResumeStyleMemory;
};

async function saveStyle(items: ResumeStyleItem[]) {
	const response = await fetch("/api/resume-style", {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ items }),
	});
	const data = (await response.json()) as ResumeStyleMemory & {
		error?: string;
	};
	if (!response.ok) {
		throw new Error(data.error || "Could not save style memory");
	}
	return data;
}

function StyleMemoryBody({
	items,
	error,
	busy,
	editor,
	setEditor,
	onCreate,
	onEdit,
	onDelete,
	onSubmitEditor,
	onCancelEditor,
}: {
	items: ResumeStyleItem[];
	error: string | null;
	busy: boolean;
	editor: EditorState | null;
	setEditor: Dispatch<SetStateAction<EditorState | null>>;
	onCreate: () => void;
	onEdit: (item: ResumeStyleItem) => void;
	onDelete: (item: ResumeStyleItem) => void;
	onSubmitEditor: () => void;
	onCancelEditor: () => void;
}) {
	if (editor) {
		return (
			<div className="grid min-h-0 flex-1 gap-3 overflow-auto px-4 py-3">
				{error ? (
					<p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-700">
						{error}
					</p>
				) : null}
				<div className="grid gap-1.5">
					<Label htmlFor="style-title">Title</Label>
					<Input
						id="style-title"
						value={editor.title}
						onChange={(event) =>
							setEditor((current) =>
								current
									? { ...current, title: event.target.value }
									: current,
							)
						}
						placeholder="Bullet style"
						maxLength={80}
					/>
				</div>
				<div className="grid gap-1.5">
					<Label htmlFor="style-instruction">Instruction</Label>
					<Textarea
						id="style-instruction"
						value={editor.instruction}
						onChange={(event) =>
							setEditor((current) =>
								current
									? { ...current, instruction: event.target.value }
									: current,
							)
						}
						placeholder="Write each bullet as a full sentence. Bold tools and metrics."
						maxLength={500}
					/>
				</div>
				<div className="flex justify-end gap-2 pt-1">
					<Button
						type="button"
						variant="outline"
						onClick={onCancelEditor}
						disabled={busy}
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={onSubmitEditor}
						disabled={busy}
					>
						Save
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			{error ? (
				<p className="mx-4 mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-700">
					{error}
				</p>
			) : null}
			<div className="min-h-0 flex-1 overflow-auto px-4 py-3">
				{items.length > 0 ? (
					<ul className="grid gap-2">
						{items.map((item) => (
							<li
								key={item.id}
								className="rounded-2xl border border-border bg-card px-3.5 py-3"
							>
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<p className="text-sm font-medium text-foreground">
											{item.title}
										</p>
										<p className="mt-1 text-sm text-muted-foreground">
											{item.instruction}
										</p>
									</div>
									<div className="flex shrink-0 gap-1">
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											onClick={() => onEdit(item)}
											disabled={busy}
											aria-label={`Edit ${item.title}`}
										>
											<PencilSimpleIcon size={16} weight="duotone" />
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											onClick={() => onDelete(item)}
											disabled={busy}
											aria-label={`Delete ${item.title}`}
										>
											<TrashIcon size={16} weight="duotone" />
										</Button>
									</div>
								</div>
							</li>
						))}
					</ul>
				) : (
					<p className="rounded-2xl border border-dashed border-border bg-surface-subtle/60 px-4 py-8 text-center text-sm text-muted-foreground">
						Nothing saved yet. Tell the resume agent how you like
						bullets written, or add a preference here.
					</p>
				)}
			</div>
			<div className="flex shrink-0 justify-end gap-2 border-t bg-muted/40 px-4 py-3">
				<Button
					type="button"
					variant="outline"
					onClick={onCreate}
					disabled={busy || items.length >= 30}
				>
					<PlusIcon data-icon="inline-start" weight="bold" />
					Add preference
				</Button>
			</div>
		</div>
	);
}

export function StyleMemoryPanel({ initialStyle }: StyleMemoryPanelProps) {
	const isMobile = useIsMobile();
	const [open, setOpen] = useState(false);
	const [items, setItems] = useState(initialStyle.items);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [editor, setEditor] = useState<EditorState | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<ResumeStyleItem | null>(
		null,
	);

	async function persist(nextItems: ResumeStyleItem[]) {
		setError(null);
		setBusy(true);
		try {
			const saved = await saveStyle(nextItems);
			setItems(saved.items);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Could not save style memory",
			);
		} finally {
			setBusy(false);
		}
	}

	function handleOpenChange(nextOpen: boolean) {
		setOpen(nextOpen);
		if (!nextOpen) {
			setEditor(null);
			setDeleteTarget(null);
			setError(null);
		}
	}

	function openCreate() {
		setError(null);
		setEditor({ title: "", instruction: "" });
	}

	function openEdit(item: ResumeStyleItem) {
		setError(null);
		setEditor({
			id: item.id,
			title: item.title,
			instruction: item.instruction,
		});
	}

	async function submitEditor() {
		if (!editor) {
			return;
		}
		const title = editor.title.trim();
		const instruction = editor.instruction.trim();
		if (!title || !instruction) {
			setError("Add a title and instruction");
			return;
		}

		const nextItem: ResumeStyleItem = {
			id: editor.id ?? crypto.randomUUID(),
			title,
			instruction,
		};
		const nextItems = editor.id
			? items.map((item) => (item.id === editor.id ? nextItem : item))
			: [...items, nextItem];

		await persist(nextItems);
		setEditor(null);
	}

	const count = items.length;
	const headerTitle = editor
		? editor.id
			? "Edit preference"
			: "Add preference"
		: "Style memory";
	const headerDescription = editor
		? "This applies to new resumes across chats."
		: "Writing preferences the resume agent keeps across chats.";

	const body = (
		<StyleMemoryBody
			items={items}
			error={error}
			busy={busy}
			editor={editor}
			setEditor={setEditor}
			onCreate={openCreate}
			onEdit={openEdit}
			onDelete={setDeleteTarget}
			onSubmitEditor={() => void submitEditor()}
			onCancelEditor={() => {
				setEditor(null);
				setError(null);
			}}
		/>
	);

	const trigger = (
		<Button
			type="button"
			variant="outline"
			className="shrink-0"
			onClick={() => handleOpenChange(true)}
			aria-expanded={open}
		>
			<SlidersHorizontalIcon data-icon="inline-start" weight="bold" />
			Style memory
			{count > 0 ? (
				<span className="rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
					{count}
				</span>
			) : null}
		</Button>
	);

	const confirm = deleteTarget ? (
		<div className="border-t px-4 py-3">
			<p className="text-sm text-muted-foreground">
				Remove &ldquo;{deleteTarget.title}&rdquo; from style memory?
			</p>
			<div className="mt-3 flex justify-end gap-2">
				<Button
					type="button"
					variant="outline"
					onClick={() => setDeleteTarget(null)}
					disabled={busy}
				>
					Cancel
				</Button>
				<Button
					type="button"
					variant="destructive"
					disabled={busy}
					onClick={() => {
						const id = deleteTarget.id;
						setDeleteTarget(null);
						void persist(items.filter((item) => item.id !== id));
					}}
				>
					Delete
				</Button>
			</div>
		</div>
	) : null;

	if (isMobile) {
		return (
			<>
				{trigger}
				<Drawer
					open={open}
					onOpenChange={handleOpenChange}
					showSwipeHandle
				>
					<DrawerContent
						className="data-[swipe-axis=y]:[--drawer-content-height:88dvh] data-[swipe-axis=y]:[--drawer-content-max-height:88dvh]"
					>
						<DrawerHeader className="text-left">
							<DrawerTitle>{headerTitle}</DrawerTitle>
							<DrawerDescription>{headerDescription}</DrawerDescription>
						</DrawerHeader>
						{body}
						{confirm}
					</DrawerContent>
				</Drawer>
			</>
		);
	}

	return (
		<>
			{trigger}
			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DialogContent
					className="flex max-h-[min(36rem,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
					showCloseButton
				>
					<DialogHeader className="px-4 pt-4">
						<DialogTitle>{headerTitle}</DialogTitle>
						<DialogDescription>{headerDescription}</DialogDescription>
					</DialogHeader>
					{body}
					{confirm}
				</DialogContent>
			</Dialog>
		</>
	);
}
