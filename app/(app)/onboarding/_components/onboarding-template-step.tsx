"use client";

import { ArrowRightIcon, CheckIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GenerationCountdown } from "@/components/templates/generation-countdown";
import {
	openTemplatePdf,
	TemplateCard,
} from "@/components/templates/template-card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { MixpanelEvent, trackEvent } from "@/lib/mixpanel";
import type { TemplateListItem, TemplateRef } from "@/lib/resume-templates/types";
import { cn } from "@/lib/utils";

type OnboardingTemplateStepProps = {
	resumeFileId: string;
	resumeMediaType: string;
	onBack: () => void;
	onContinue: () => void;
};

function canBuildTemplateFromMediaType(mediaType: string) {
	return (
		mediaType.startsWith("image/") || mediaType === "application/pdf"
	);
}

export function OnboardingTemplateStep({
	resumeFileId,
	resumeMediaType,
	onBack,
	onContinue,
}: OnboardingTemplateStepProps) {
	const canUseResumeLook = canBuildTemplateFromMediaType(resumeMediaType);
	const [selectedRef, setSelectedRef] = useState<TemplateRef | null>(null);
	const [preferResume, setPreferResume] = useState(canUseResumeLook);
	const [templates, setTemplates] = useState<TemplateListItem[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [selectingRef, setSelectingRef] = useState<string | null>(null);
	const [continuing, setContinuing] = useState(false);
	const userChoseRef = useRef(false);
	const lastTrackedRef = useRef<string | null>(null);

	const library = useMemo(
		() => templates.filter((template) => template.kind === "builtin"),
		[templates],
	);

	const resumeTemplate = useMemo(() => {
		if (!resumeFileId) {
			return null;
		}
		return (
			templates.find(
				(template) =>
					template.kind === "custom" &&
					template.sourceFileId === resumeFileId,
			) ?? null
		);
	}, [templates, resumeFileId]);

	const refresh = useCallback(async () => {
		const response = await fetch("/api/templates");
		if (!response.ok) {
			throw new Error("Could not load templates");
		}
		const data = (await response.json()) as {
			templates: TemplateListItem[];
		};
		setTemplates(data.templates);
		return data;
	}, []);

	useEffect(() => {
		void (async () => {
			try {
				await refresh();
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Could not load templates",
				);
			} finally {
				setLoading(false);
			}
		})();
	}, [refresh]);

	useEffect(() => {
		const drafting = templates.some((template) => template.status === "drafting");
		if (!drafting) {
			return;
		}
		const timer = window.setInterval(() => {
			void refresh().catch(() => undefined);
		}, 2500);
		return () => window.clearInterval(timer);
	}, [templates, refresh]);

	const selectTemplate = useCallback(async (templateRef: TemplateRef) => {
		setError(null);
		setSelectingRef(templateRef);
		try {
			const response = await fetch("/api/onboarding/progress", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					step: "template",
					templateRef,
				}),
			});
			const data = (await response.json()) as {
				error?: string;
				context?: { templateRef?: string | null };
			};
			if (!response.ok) {
				throw new Error(data.error || "Could not select template");
			}
			setSelectedRef(
				(data.context?.templateRef as TemplateRef) || templateRef,
			);
			const selected =
				(data.context?.templateRef as TemplateRef) || templateRef;
			if (lastTrackedRef.current !== selected) {
				lastTrackedRef.current = selected;
				trackEvent(MixpanelEvent.OnboardingTemplateSelected, {
					template_ref: selected,
				});
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not select template");
			throw err;
		} finally {
			setSelectingRef(null);
		}
	}, []);

	useEffect(() => {
		if (!preferResume || userChoseRef.current) {
			return;
		}
		if (!resumeTemplate) {
			return;
		}
		setSelectedRef(resumeTemplate.ref);
		if (resumeTemplate.status === "ready") {
			void selectTemplate(resumeTemplate.ref).catch(() => undefined);
		}
	}, [preferResume, resumeTemplate, selectTemplate]);

	function chooseResume() {
		userChoseRef.current = true;
		setPreferResume(true);
		setError(null);
		if (resumeTemplate) {
			setSelectedRef(resumeTemplate.ref);
			if (resumeTemplate.status === "ready") {
				void selectTemplate(resumeTemplate.ref).catch(() => undefined);
			}
		} else {
			setSelectedRef(null);
		}
	}

	async function chooseLibrary(template: TemplateListItem) {
		userChoseRef.current = true;
		setPreferResume(false);
		try {
			await selectTemplate(template.ref);
		} catch {
			setPreferResume(true);
		}
	}

	async function continueNext() {
		setError(null);

		if (preferResume) {
			if (!resumeTemplate) {
				setError("Your resume template is still being prepared.");
				return;
			}
			if (resumeTemplate.status === "drafting") {
				setError("Your resume template is almost ready — hang tight a moment.");
				return;
			}
			if (resumeTemplate.status === "failed") {
				setError(
					resumeTemplate.error ||
						"Could not build a template from your resume. Pick one from the library instead.",
				);
				return;
			}
			setContinuing(true);
			try {
				await selectTemplate(resumeTemplate.ref);
				onContinue();
			} catch {
				setContinuing(false);
			}
			return;
		}

		if (!selectedRef) {
			setError("Select a template to continue.");
			return;
		}
		const selected = templates.find((template) => template.ref === selectedRef);
		if (!selected || selected.status !== "ready") {
			setError("Select a ready template to continue.");
			return;
		}
		setContinuing(true);
		try {
			await selectTemplate(selected.ref);
			onContinue();
		} catch {
			setContinuing(false);
		}
	}

	const resumeSelected = preferResume && canUseResumeLook;
	const showResumeSlot = Boolean(resumeFileId) && canUseResumeLook;

	return (
		<div className="mx-auto w-full max-w-6xl px-4 py-8 pb-28 sm:px-6">
			<div className="mb-8 max-w-2xl">
				<p className="text-sm font-medium text-muted-foreground">
					Step 5 of 6
				</p>
				<h1 className="font-display mt-1 text-[24px] font-medium tracking-[-0.48px] text-foreground">
					Choose a resume template
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Keep the look of your uploaded resume, or pick a layout from our
					library. You can change this later.
				</p>
			</div>

			{error ? (
				<p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-700">
					{error}
				</p>
			) : null}

			{loading ? (
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<Spinner className="size-4" />
					Loading templates…
				</div>
			) : (
				<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
					{showResumeSlot ? (
						resumeTemplate ? (
							<TemplateCard
								template={{
									...resumeTemplate,
									name: "Your resume",
									description:
										resumeTemplate.status === "failed"
											? "Could not finish this layout — pick a library template instead"
											: "Matched to the resume you uploaded",
									category: "Your upload",
									styleLabel: "From your file",
								}}
								selected={resumeSelected}
								busy={selectingRef === resumeTemplate.ref}
								allowChooseWhileDrafting
								chooseLabel="Choose"
								onPreview={() => openTemplatePdf(resumeTemplate)}
								onUse={chooseResume}
							/>
						) : (
							<YourResumePlaceholder
								selected={resumeSelected}
								onChoose={chooseResume}
							/>
						)
					) : null}

					{library.map((template) => (
						<TemplateCard
							key={template.ref}
							template={template}
							selected={!preferResume && selectedRef === template.ref}
							busy={selectingRef === template.ref}
							chooseLabel="Choose"
							onPreview={() => openTemplatePdf(template)}
							onUse={() => void chooseLibrary(template)}
						/>
					))}
				</div>
			)}

			<div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 px-4 sm:px-6">
				<div className="pointer-events-auto mx-auto flex w-full max-w-6xl items-center justify-between gap-3 rounded-2xl border border-border bg-background/90 px-4 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur-md">
					<Button type="button" variant="ghost" onClick={onBack}>
						Back
					</Button>
					<Button
						type="button"
						disabled={
							continuing ||
							(preferResume
								? !resumeTemplate || resumeTemplate.status !== "ready"
								: !selectedRef)
						}
						onClick={() => void continueNext()}
					>
						{continuing ? <Spinner className="size-4" /> : null}
						{continuing
							? "Saving…"
							: preferResume && resumeTemplate?.status === "drafting"
								? "Preparing your template…"
								: "Continue"}
						{!continuing &&
						!(preferResume && resumeTemplate?.status === "drafting") ? (
							<ArrowRightIcon size={16} weight="bold" />
						) : null}
					</Button>
				</div>
			</div>
		</div>
	);
}

function YourResumePlaceholder({
	selected,
	onChoose,
}: {
	selected: boolean;
	onChoose: () => void;
}) {
	return (
		<article className="group flex flex-col">
			<div
				className={cn(
					"relative overflow-hidden rounded-[28px] bg-pastel-blush p-3 transition-shadow sm:p-3.5",
					selected
						? "ring-2 ring-brand/50 ring-offset-2 ring-offset-background"
						: "hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)]",
				)}
			>
				<div className="relative overflow-hidden rounded-2xl bg-card product-shadow">
					<div className="flex aspect-210/297 flex-col items-center justify-center gap-4 p-6 text-center">
						<GenerationCountdown />
						<Button
							type="button"
							size="lg"
							className="h-11 w-[min(100%,13.5rem)] cursor-pointer rounded-full bg-brand text-sm font-semibold text-brand-foreground brand-shadow hover:bg-brand/90"
							onClick={onChoose}
						>
							Choose
						</Button>
					</div>
				</div>
				{selected ? (
					<span className="absolute top-3 right-3 z-10 flex size-6 items-center justify-center rounded-full bg-brand text-white shadow-sm">
						<CheckIcon size={14} weight="bold" />
					</span>
				) : null}
				<div className="mt-2.5 flex items-center gap-2 px-0.5">
					<span className="truncate text-xs text-muted-foreground">
						From your file
					</span>
				</div>
			</div>
			<div className="mt-3 space-y-1 px-0.5">
				<div className="flex items-center gap-2">
					<p className="text-[15px] font-semibold tracking-[-0.2px]">
						Your resume
					</p>
					<span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
						Your upload
					</span>
				</div>
				<p className="line-clamp-2 text-sm leading-5 text-muted-foreground">
					Matched to the resume you uploaded
				</p>
				{selected ? (
					<p className="text-xs font-medium text-brand">Selected</p>
				) : null}
			</div>
		</article>
	);
}
