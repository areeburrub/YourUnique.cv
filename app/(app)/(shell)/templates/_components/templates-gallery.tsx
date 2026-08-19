"use client";

import { UploadSimpleIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { StyleMemoryPanel } from "@/components/templates/style-memory-panel";
import {
	openTemplatePdf,
	TemplateCard,
} from "@/components/templates/template-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { uploadChatFile } from "@/lib/client-uploads";
import { MixpanelEvent, trackEvent } from "@/lib/mixpanel";
import type { ResumeStyleMemory } from "@/lib/resume-style";
import type { TemplateListItem, TemplateRef } from "@/lib/resume-templates/types";
import {
	mediaTypeFromFilename,
	resolveUploadMediaType,
} from "@/lib/uploads";

type TemplatesGalleryProps = {
	initialSelectedRef: TemplateRef;
	initialTemplates: TemplateListItem[];
	initialStyle: ResumeStyleMemory;
};

export function TemplatesGallery({
	initialSelectedRef,
	initialTemplates,
	initialStyle,
}: TemplatesGalleryProps) {
	const [selectedRef, setSelectedRef] = useState(initialSelectedRef);
	const [templates, setTemplates] = useState(initialTemplates);
	const [error, setError] = useState<string | null>(null);
	const [selectingRef, setSelectingRef] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [pendingCustomRef, setPendingCustomRef] = useState<TemplateRef | null>(
		null,
	);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const available = useMemo(
		() => templates.filter((template) => template.kind === "builtin"),
		[templates],
	);
	const yours = useMemo(
		() => templates.filter((template) => template.kind === "custom"),
		[templates],
	);

	const refresh = useCallback(async () => {
		const response = await fetch("/api/templates");
		if (!response.ok) {
			return;
		}
		const data = (await response.json()) as {
			selectedRef: TemplateRef;
			templates: TemplateListItem[];
		};
		setSelectedRef(data.selectedRef);
		setTemplates(data.templates);
	}, []);

	useEffect(() => {
		const drafting = templates.some((template) => template.status === "drafting");
		if (!drafting) {
			return;
		}
		const timer = window.setInterval(() => {
			void refresh();
		}, 2500);
		return () => window.clearInterval(timer);
	}, [templates, refresh]);

	const selectTemplate = useCallback(async (templateRef: TemplateRef) => {
		setError(null);
		setSelectingRef(templateRef);
		try {
			const response = await fetch("/api/templates/select", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ templateRef }),
			});
			const data = (await response.json()) as {
				error?: string;
				templateRef?: string;
			};
			if (!response.ok) {
				throw new Error(data.error || "Could not select template");
			}
			setSelectedRef((data.templateRef as TemplateRef) || templateRef);
			trackEvent(MixpanelEvent.TemplateSelected, {
				template_ref: (data.templateRef as TemplateRef) || templateRef,
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not select template");
		} finally {
			setSelectingRef(null);
		}
	}, []);

	useEffect(() => {
		if (!pendingCustomRef) {
			return;
		}
		const pending = templates.find(
			(template) => template.ref === pendingCustomRef,
		);
		if (!pending) {
			return;
		}
		if (pending.status === "ready") {
			void selectTemplate(pending.ref).then(() => setPendingCustomRef(null));
			return;
		}
		if (pending.status === "failed") {
			setPendingCustomRef(null);
			setError(pending.error || "Custom template generation failed");
		}
	}, [pendingCustomRef, templates, selectTemplate]);

	async function startFromUpload(file: File) {
		setError(null);
		setUploading(true);
		trackEvent(MixpanelEvent.CustomTemplateUploadStarted);
		const objectUrl = URL.createObjectURL(file);
		try {
			const mediaType =
				resolveUploadMediaType({
					filename: file.name,
					mediaType: file.type || mediaTypeFromFilename(file.name),
				}) || file.type;
			if (
				!mediaType.startsWith("image/") &&
				mediaType !== "application/pdf"
			) {
				throw new Error("Upload a PDF or image of your resume format");
			}

			const uploaded = await uploadChatFile({
				file: {
					type: "file",
					filename: file.name,
					mediaType,
					url: objectUrl,
				},
			});

			const response = await fetch("/api/templates/from-upload", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ fileId: uploaded.id }),
			});
			const data = (await response.json()) as {
				error?: string;
				templateRef?: TemplateRef;
			};
			if (!response.ok) {
				throw new Error(data.error || "Could not start template generation");
			}
			if (data.templateRef) {
				setPendingCustomRef(data.templateRef);
			}
			await refresh();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Could not create template",
			);
		} finally {
			URL.revokeObjectURL(objectUrl);
			setUploading(false);
		}
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<div className="min-h-0 flex-1 overflow-auto">
				<div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
					<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<h1 className="font-display text-[24px] font-medium tracking-[-0.48px] text-foreground">
							Templates
						</h1>
						<div className="flex items-center gap-2">
							<input
								ref={fileInputRef}
								type="file"
								accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
								className="hidden"
								onChange={(event) => {
									const file = event.target.files?.[0];
									event.target.value = "";
									if (file) {
										void startFromUpload(file);
									}
								}}
							/>
							<StyleMemoryPanel initialStyle={initialStyle} />
							<Button
								type="button"
								className="shrink-0"
								onClick={() => fileInputRef.current?.click()}
								disabled={uploading}
							>
								{uploading ? (
									<Spinner className="size-4" />
								) : (
									<UploadSimpleIcon data-icon="inline-start" weight="bold" />
								)}
								Upload PDF
							</Button>
						</div>
					</div>

					{error ? (
						<p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-700">
							{error}
						</p>
					) : null}

					<section className="space-y-4">
						<div>
							<h2 className="text-base font-semibold tracking-[-0.2px]">
								Your templates
							</h2>
							<p className="mt-1 text-sm text-muted-foreground">
								Layouts generated from formats you uploaded.
							</p>
						</div>
						{yours.length > 0 ? (
							<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
								{yours.map((template) => (
									<TemplateCard
										key={template.ref}
										template={template}
										selected={selectedRef === template.ref}
										busy={selectingRef === template.ref}
										onPreview={() => openTemplatePdf(template)}
										onUse={() => void selectTemplate(template.ref)}
									/>
								))}
							</div>
						) : (
							<p className="rounded-2xl border border-dashed border-border bg-surface-subtle/60 px-4 py-8 text-center text-sm text-muted-foreground">
								Nothing here yet. Upload a PDF to create one.
							</p>
						)}
					</section>

					<Separator className="my-10" />

					<section className="space-y-4">
						<div>
							<h2 className="text-base font-semibold tracking-[-0.2px]">
								Available templates
							</h2>
							<p className="mt-1 text-sm text-muted-foreground">
								Ready-made layouts you can use as-is.
							</p>
						</div>
						{available.length > 0 ? (
							<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
								{available.map((template) => (
									<TemplateCard
										key={template.ref}
										template={template}
										selected={selectedRef === template.ref}
										busy={selectingRef === template.ref}
										onPreview={() => openTemplatePdf(template)}
										onUse={() => void selectTemplate(template.ref)}
									/>
								))}
							</div>
						) : (
							<p className="text-sm text-muted-foreground">No templates yet.</p>
						)}
					</section>
				</div>
			</div>
		</div>
	);
}
