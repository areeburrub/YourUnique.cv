"use client";

import { Check, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { TemplateListItem } from "@/lib/resume-templates/types";
import { cn } from "@/lib/utils";

export function openTemplatePdf(template: TemplateListItem) {
	if (!template.previewPdfUrl) {
		return;
	}
	window.open(template.previewPdfUrl, "_blank", "noopener,noreferrer");
}

export function TemplateCard({
	template,
	selected,
	busy,
	onPreview,
	onUse,
	allowChooseWhileDrafting = false,
	chooseLabel = "Use this template",
}: {
	template: TemplateListItem;
	selected: boolean;
	busy: boolean;
	onPreview: () => void;
	onUse: () => void;
	allowChooseWhileDrafting?: boolean;
	chooseLabel?: string;
}) {
	const drafting = template.status === "drafting";
	const failed = template.status === "failed";
	const canPreview =
		Boolean(template.previewPdfUrl) && template.status === "ready";
	const canUse =
		!busy &&
		!selected &&
		!failed &&
		(template.status === "ready" ||
			(allowChooseWhileDrafting && drafting));
	const showActions = canPreview || canUse;

	return (
		<article className="group flex flex-col">
			<div
				className={cn(
					"relative overflow-hidden rounded-2xl bg-[#e8ebef] p-2.5 transition-shadow sm:p-3",
					selected
						? "ring-2 ring-brand/50 ring-offset-2 ring-offset-background"
						: "hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)]",
				)}
			>
				<div className="relative overflow-hidden rounded-lg bg-white shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
					{template.previewUrl ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={template.previewUrl}
							alt={`${template.name} preview`}
							className="aspect-210/297 h-auto w-full object-cover object-top"
						/>
					) : (
						<div className="flex aspect-210/297 items-center justify-center p-4 text-center text-xs text-muted-foreground">
							{drafting ? "Generating…" : failed ? "Failed" : "No preview"}
						</div>
					)}

					{showActions ? (
						<div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-100 transition-all max-md:bg-black/35 md:opacity-0 md:group-hover:bg-black/40 md:group-hover:opacity-100">
							<div className="flex w-[min(100%,13.5rem)] flex-col gap-2.5 px-4">
								{canUse ? (
									<Button
										type="button"
										size="lg"
										disabled={busy}
										className="h-10 w-full cursor-pointer rounded-xl bg-brand text-sm font-semibold text-brand-foreground shadow-[0_8px_24px_rgba(2,91,255,0.35)] hover:bg-brand/90"
										onClick={onUse}
									>
										{busy ? <Spinner className="size-4" /> : null}
										{chooseLabel}
									</Button>
								) : null}
								{canPreview ? (
									<Button
										type="button"
										size="lg"
										variant="secondary"
										className="h-10 w-full cursor-pointer rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-900 shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:bg-zinc-50 hover:text-zinc-900"
										onClick={onPreview}
									>
										Preview
									</Button>
								) : null}
							</div>
						</div>
					) : null}
				</div>

				{drafting ? (
					<div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#e8ebef]/70">
						<LoaderCircle className="size-6 animate-spin text-foreground" />
					</div>
				) : null}

				{selected ? (
					<span className="absolute top-3 right-3 z-10 flex size-6 items-center justify-center rounded-full bg-brand text-white shadow-sm">
						<Check className="size-3.5" strokeWidth={2.5} />
					</span>
				) : null}

				<div className="mt-2.5 flex items-center gap-2 px-0.5">
					<div className="flex items-center gap-1">
						{template.colors.slice(0, 5).map((color) => (
							<span
								key={color}
								className="size-2.5 rounded-full ring-1 ring-black/10"
								style={{ backgroundColor: color }}
							/>
						))}
					</div>
					<span className="truncate text-xs text-muted-foreground">
						{template.styleLabel}
					</span>
				</div>
			</div>

			<div className="mt-3 space-y-1 px-0.5">
				<div className="flex items-center gap-2">
					<p className="text-[15px] font-semibold tracking-[-0.2px]">
						{template.name}
					</p>
					<span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
						{template.category}
					</span>
					{template.status !== "ready" ? (
						<span className="text-[10px] text-muted-foreground capitalize">
							{template.status}
						</span>
					) : null}
				</div>
				{template.description ? (
					<p className="line-clamp-2 text-sm leading-5 text-muted-foreground">
						{template.description}
					</p>
				) : null}
				{selected ? (
					<p className="text-xs font-medium text-brand">Selected</p>
				) : null}
			</div>
		</article>
	);
}
