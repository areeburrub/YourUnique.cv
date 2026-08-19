"use client";

import { CheckIcon, FileArrowUpIcon, TrashIcon } from "@phosphor-icons/react";
import confetti from "canvas-confetti";
import { useEffect, useRef, useState } from "react";

import { SpeechToTextButton } from "@/components/chat/speech-to-text-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { MixpanelEvent, setMixpanelPeople, trackEvent } from "@/lib/mixpanel";
import {
	consumePendingOnboardingResume,
	saveOnboardingProgress,
	uploadOnboardingResume,
} from "@/lib/onboarding/client";
import { PLAN_COPY, PRO_PRICE_USD, TRIAL_DAYS } from "@/lib/plan-copy";
import { PlanId, type PlanId as PlanIdType } from "@/lib/plans";
import { isLinkedInProfileUrl } from "@/lib/scrapecreators";
import { ONBOARDING_UPLOAD_ACCEPT } from "@/lib/uploads";
import { cn } from "@/lib/utils";

import { OnboardingGenerateStep } from "./onboarding-generate-step";
import { OnboardingTemplateStep } from "./onboarding-template-step";

type WizardStep =
	| "resume"
	| "linkedin"
	| "notes"
	| "generate"
	| "template"
	| "plan";

type GenerateStage = "analyzing" | "linkedin" | "writing" | "done";

const PLAN_CARDS = [
	{
		id: PlanId.PRO,
		...PLAN_COPY.PRO,
		featured: true,
	},
	{
		id: PlanId.LIFETIME,
		...PLAN_COPY.LIFETIME,
		featured: false,
	},
] as const;

const STEP_META: Record<
	Exclude<WizardStep, "generate" | "template" | "plan">,
	{ eyebrow: string; title: string; description: string }
> = {
	resume: {
		eyebrow: "Step 1 of 6",
		title: "Upload your resume",
		description:
			"We'll use your current resume as the foundation for your career profile.",
	},
	linkedin: {
		eyebrow: "Step 2 of 6",
		title: "Add your LinkedIn",
		description:
			"Optional — if you share a profile URL, we'll pull public details to fill gaps.",
	},
	notes: {
		eyebrow: "Step 3 of 6",
		title: "Anything else we should know?",
		description:
			"Share goals, wins, skills, or context that isn't on your resume. Type or speak.",
	},
};

function fireConfetti() {
	const defaults = {
		startVelocity: 28,
		spread: 360,
		ticks: 70,
		zIndex: 80,
	};
	confetti({
		...defaults,
		particleCount: 90,
		origin: { x: 0.2, y: 0.35 },
	});
	confetti({
		...defaults,
		particleCount: 90,
		origin: { x: 0.8, y: 0.35 },
	});
}

type OnboardingWizardProps = {
	initialStep: WizardStep;
	initialResumeFileId: string;
	initialResumeFilename: string;
	initialResumeMediaType: string;
	initialLinkedinUrl: string;
	initialIntroduction: string;
};

export function OnboardingWizard({
	initialStep,
	initialResumeFileId,
	initialResumeFilename,
	initialResumeMediaType,
	initialLinkedinUrl,
	initialIntroduction,
}: OnboardingWizardProps) {
	const [step, setStep] = useState<WizardStep>(initialStep);
	const [fileId, setFileId] = useState(initialResumeFileId);
	const [filename, setFilename] = useState(initialResumeFilename);
	const [mediaType, setMediaType] = useState(initialResumeMediaType);
	const [linkedinUrl, setLinkedinUrl] = useState(initialLinkedinUrl);
	const [notes, setNotes] = useState(initialIntroduction);
	const [uploading, setUploading] = useState(false);
	const [uploadPercent, setUploadPercent] = useState(0);
	const [savingStep, setSavingStep] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [generateStage, setGenerateStage] =
		useState<GenerateStage>("analyzing");
	const [profilePreview, setProfilePreview] = useState("");
	const [submittingPlan, setSubmittingPlan] = useState<PlanIdType | null>(
		null,
	);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const generateStartedRef = useRef(false);
	const pendingStartedRef = useRef(false);

	useEffect(() => {
		trackEvent(MixpanelEvent.OnboardingStepViewed, { step });
	}, [step]);

	useEffect(() => {
		if (pendingStartedRef.current) {
			return;
		}
		pendingStartedRef.current = true;
		void (async () => {
			try {
				const uploaded = await consumePendingOnboardingResume(
					(progress) => {
						setStep("resume");
						setUploading(true);
						setUploadPercent(progress.percent);
					},
				);
				if (uploaded) {
					setFileId(uploaded.id);
					setFilename(uploaded.filename);
					setMediaType(uploaded.mediaType);
					trackEvent(MixpanelEvent.OnboardingResumeUploaded, {
						source: "pending",
					});
					setStep("linkedin");
					return;
				}
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Could not upload resume",
				);
				setStep("resume");
				return;
			} finally {
				setUploading(false);
			}

			if (initialStep === "generate" && !generateStartedRef.current) {
				generateStartedRef.current = true;
				setGenerateStage("analyzing");
				void runGenerate();
			}
		})();
	}, [initialStep]);

	async function handleResumeSelected(
		event: { target: HTMLInputElement },
	) {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) {
			return;
		}

		setError(null);
		setUploading(true);
		setUploadPercent(0);

		try {
			const uploaded = await uploadOnboardingResume(file, (progress) => {
				setUploadPercent(progress.percent);
			});
			setFileId(uploaded.id);
			setFilename(uploaded.filename);
			setMediaType(uploaded.mediaType);
			await saveOnboardingProgress({
				step: "resume",
				resumeFileId: uploaded.id,
			});
			trackEvent(MixpanelEvent.OnboardingResumeUploaded);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Could not upload resume",
			);
		} finally {
			setUploading(false);
		}
	}

	function clearResume() {
		setFileId("");
		setFilename("");
		setMediaType("");
	}

	async function goLinkedIn() {
		if (!fileId) {
			setError("Upload your resume to continue.");
			return;
		}
		setError(null);
		setSavingStep(true);
		try {
			await saveOnboardingProgress({
				step: "resume",
				resumeFileId: fileId,
			});
			setStep("linkedin");
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Could not save resume",
			);
		} finally {
			setSavingStep(false);
		}
	}

	async function goNotesFromLinkedIn(skip: boolean) {
		const trimmed = linkedinUrl.trim();
		if (!skip && trimmed && !isLinkedInProfileUrl(trimmed)) {
			setError("Enter a valid LinkedIn profile URL, or skip this step.");
			return;
		}
		const nextUrl = skip ? "" : trimmed;
		if (skip) {
			setLinkedinUrl("");
		}
		setError(null);
		setSavingStep(true);
		try {
			await saveOnboardingProgress({
				step: "linkedin",
				linkedinUrl: nextUrl,
			});
			trackEvent(MixpanelEvent.OnboardingLinkedInSaved, {
				skipped: skip,
			});
			setStep("notes");
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Could not save LinkedIn",
			);
		} finally {
			setSavingStep(false);
		}
	}

	async function startGenerate(skipNotes = false) {
		if (!fileId) {
			setError("Upload your resume to continue.");
			setStep("resume");
			return;
		}
		if (generateStartedRef.current) {
			return;
		}
		const introduction = skipNotes ? "" : notes.trim();
		if (skipNotes) {
			setNotes("");
		}
		setError(null);
		setSavingStep(true);
		try {
			await saveOnboardingProgress({
				step: "linkedin",
				linkedinUrl: linkedinUrl.trim(),
			});
			await saveOnboardingProgress({
				step: "notes",
				introduction,
			});
			trackEvent(MixpanelEvent.OnboardingNotesSaved, {
				skipped: skipNotes,
			});
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Could not save introduction",
			);
			setSavingStep(false);
			return;
		}
		setSavingStep(false);
		generateStartedRef.current = true;
		setProfilePreview("");
		setGenerateStage("analyzing");
		setStep("generate");
		void runGenerate();
	}

	async function runGenerate() {
		setError(null);
		setGenerateStage("analyzing");
		setProfilePreview("");
		trackEvent(MixpanelEvent.OnboardingProfileGenerationStarted, {
			has_linkedin: Boolean(linkedinUrl.trim()),
			has_notes: Boolean(notes.trim()),
		});

		const hasLinkedIn = Boolean(linkedinUrl.trim());
		let linkedinTimer: ReturnType<typeof setTimeout> | null = null;
		if (hasLinkedIn) {
			linkedinTimer = setTimeout(() => {
				setGenerateStage((current) =>
					current === "analyzing" ? "linkedin" : current,
				);
			}, 700);
		}

		try {
			const response = await fetch("/api/onboarding/generate-profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					fileId,
					linkedinUrl: linkedinUrl.trim() || undefined,
					notes: notes.trim() || undefined,
				}),
			});

			if (!response.ok) {
				const data = (await response.json().catch(() => null)) as {
					error?: string;
				} | null;
				throw new Error(data?.error || "Could not generate your profile");
			}

			if (!response.body) {
				throw new Error("Empty response while generating profile");
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let full = "";
			let sawFirstToken = false;

			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					break;
				}
				const chunk = decoder.decode(value, { stream: true });
				if (!chunk) {
					continue;
				}
				if (!sawFirstToken) {
					sawFirstToken = true;
					if (linkedinTimer) {
						clearTimeout(linkedinTimer);
						linkedinTimer = null;
					}
					setGenerateStage("writing");
				}
				full += chunk;
				setProfilePreview(full);
			}

			if (linkedinTimer) {
				clearTimeout(linkedinTimer);
			}

			if (!full.trim()) {
				throw new Error("Profile generation returned an empty result");
			}

			await saveOnboardingProgress({
				step: "profile",
				fileId,
				profile: full.trim(),
				linkedinUrl: linkedinUrl.trim(),
				introduction: notes.trim(),
			});

			setGenerateStage("done");
			trackEvent(MixpanelEvent.OnboardingProfileGenerationCompleted);
			fireConfetti();
			window.setTimeout(() => {
				setStep("template");
			}, 900);
		} catch (err) {
			if (linkedinTimer) {
				clearTimeout(linkedinTimer);
			}
			generateStartedRef.current = false;
			trackEvent(MixpanelEvent.OnboardingProfileGenerationFailed, {
				error:
					err instanceof Error ? err.message : "Something went wrong",
			});
			setError(
				err instanceof Error ? err.message : "Something went wrong",
			);
			setStep("notes");
		}
	}

	async function completeOnboarding(planId: PlanIdType) {
		setError(null);
		setSubmittingPlan(planId);
		trackEvent(MixpanelEvent.OnboardingPlanSelected, { plan: planId });
		setMixpanelPeople({ plan: planId });
		try {
			const response = await fetch("/api/onboarding/complete", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ planId }),
			});
			const data = (await response.json()) as {
				redirectUrl?: string;
				error?: string;
				nextStep?: WizardStep;
			};
			if (!response.ok || !data.redirectUrl) {
				if (data.nextStep && data.nextStep !== "plan") {
					setStep(data.nextStep);
				}
				throw new Error(data.error || "Could not finish plan selection");
			}
			trackEvent(MixpanelEvent.OnboardingCompleted, { plan: planId }, {
				sendImmediately: true,
			});
			if (data.redirectUrl.includes("checkout")) {
				trackEvent(
					MixpanelEvent.CheckoutStarted,
					{
						source: "onboarding",
					},
					{ sendImmediately: true },
				);
			}
			window.location.href = data.redirectUrl;
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Something went wrong",
			);
			setSubmittingPlan(null);
		}
	}

	if (step === "generate") {
		return (
			<OnboardingGenerateStep
				generateStage={generateStage}
				hasLinkedIn={Boolean(linkedinUrl.trim())}
				profilePreview={profilePreview}
			/>
		);
	}

	if (step === "template") {
		return (
			<OnboardingTemplateStep
				resumeFileId={fileId}
				resumeMediaType={mediaType}
				onBack={() => setStep("notes")}
				onContinue={() => setStep("plan")}
			/>
		);
	}

	if (step === "plan") {
		return (
			<PlanStep
				error={error}
				submittingPlan={submittingPlan}
				onComplete={(planId) => void completeOnboarding(planId)}
				onMissingStep={(nextStep) => setStep(nextStep)}
			/>
		);
	}

	const meta = STEP_META[step];

	return (
		<div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-10 sm:px-6 sm:py-14">
			<div className="mb-8">
				<p className="text-sm font-medium text-muted-foreground">
					{meta.eyebrow}
				</p>
				<h1 className="font-display mt-2 text-3xl font-semibold tracking-[-0.6px] sm:text-4xl sm:tracking-[-0.8px]">
					{meta.title}
				</h1>
				<p className="mt-3 text-base leading-6 text-muted-foreground">
					{meta.description}
				</p>
			</div>

			{step === "resume" ? (
				<div className="flex flex-col gap-4">
					<input
						ref={fileInputRef}
						type="file"
						accept={ONBOARDING_UPLOAD_ACCEPT}
						className="sr-only"
						onChange={handleResumeSelected}
					/>
					{fileId ? (
						<div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3">
							<div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-pastel-blush text-brand">
								<FileArrowUpIcon size={22} weight="duotone" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium text-foreground">
									{filename}
								</p>
								<p className="text-xs text-muted-foreground">
									Ready to continue
								</p>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={clearResume}
								aria-label="Remove resume"
							>
								<TrashIcon size={16} />
							</Button>
						</div>
					) : (
						<button
							type="button"
							disabled={uploading}
							onClick={() => fileInputRef.current?.click()}
							className="flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface-subtle/30 px-6 py-10 text-center transition-colors hover:border-brand/40 hover:bg-surface-subtle/50 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{uploading ? (
								<>
									<Spinner className="size-6" />
									<p className="text-sm text-muted-foreground">
										Uploading… {uploadPercent}%
									</p>
								</>
							) : (
								<>
									<span className="flex size-16 items-center justify-center rounded-[22px] bg-pastel-blush text-brand">
										<FileArrowUpIcon
											size={28}
											weight="duotone"
										/>
									</span>
									<div>
										<p className="text-sm font-medium text-foreground">
											Drop or choose your resume
										</p>
										<p className="mt-1 text-xs text-muted-foreground">
											PDF, up to 10MB
										</p>
									</div>
								</>
							)}
						</button>
					)}

					<div className="mt-4 flex justify-end">
						<Button
							size="lg"
							disabled={!fileId || uploading || savingStep}
							onClick={() => void goLinkedIn()}
							className="cursor-pointer"
						>
							{savingStep ? <Spinner className="size-4" /> : null}
							Continue
						</Button>
					</div>
				</div>
			) : null}

			{step === "linkedin" ? (
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<Label htmlFor="linkedin-url">LinkedIn profile URL</Label>
						<Input
							id="linkedin-url"
							type="url"
							placeholder="https://www.linkedin.com/in/you"
							value={linkedinUrl}
							onChange={(event) =>
								setLinkedinUrl(event.target.value)
							}
							className="h-11"
						/>
					</div>
					<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
						<Button
							type="button"
							variant="ghost"
							disabled={savingStep}
							onClick={() => setStep("resume")}
							className="cursor-pointer"
						>
							Back
						</Button>
						<div className="flex gap-2">
							<Button
								type="button"
								variant="outline"
								disabled={savingStep}
								onClick={() => void goNotesFromLinkedIn(true)}
								className="cursor-pointer"
							>
								Skip
							</Button>
							<Button
								type="button"
								disabled={savingStep}
								onClick={() => void goNotesFromLinkedIn(false)}
								className="cursor-pointer"
							>
								{savingStep ? <Spinner className="size-4" /> : null}
								Continue
							</Button>
						</div>
					</div>
				</div>
			) : null}

			{step === "notes" ? (
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<div className="flex items-center justify-between gap-3">
							<Label htmlFor="extra-notes">Extra context</Label>
							<SpeechToTextButton
								text={notes}
								onTextChange={setNotes}
								onError={setError}
							/>
						</div>
						<Textarea
							id="extra-notes"
							value={notes}
							onChange={(event) => setNotes(event.target.value)}
							placeholder="Target roles, achievements, stack preferences, relocation, anything helpful…"
							className="max-h-64 min-h-40 overflow-y-auto"
						/>
					</div>
					<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
						<Button
							type="button"
							variant="ghost"
							disabled={savingStep}
							onClick={() => setStep("linkedin")}
							className="cursor-pointer"
						>
							Back
						</Button>
						<div className="flex gap-2">
							<Button
								type="button"
								variant="outline"
								disabled={savingStep}
								onClick={() => void startGenerate(true)}
								className="cursor-pointer"
							>
								Skip
							</Button>
							<Button
								type="button"
								disabled={savingStep}
								onClick={() => void startGenerate(false)}
								className="cursor-pointer"
							>
								{savingStep ? <Spinner className="size-4" /> : null}
								Build my profile
							</Button>
						</div>
					</div>
				</div>
			) : null}

			{error ? (
				<p className="mt-6 text-sm text-destructive">{error}</p>
			) : null}
		</div>
	);
}

function PlanStep({
	error,
	submittingPlan,
	onComplete,
	onMissingStep,
}: {
	error: string | null;
	submittingPlan: PlanIdType | null;
	onComplete: (planId: PlanIdType) => void;
	onMissingStep: (step: WizardStep) => void;
}) {
	useEffect(() => {
		void (async () => {
			const response = await fetch("/api/onboarding/progress");
			if (!response.ok) {
				return;
			}
			const data = (await response.json()) as {
				complete?: boolean;
				nextStep?: WizardStep;
			};
			if (!data.complete && data.nextStep && data.nextStep !== "plan") {
				onMissingStep(data.nextStep);
			}
		})();
	}, [onMissingStep]);

	const busy = submittingPlan !== null;

	return (
		<div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 py-10 sm:px-6 sm:py-14">
			<div className="mb-10 max-w-lg text-center">
				<p className="text-sm font-medium text-muted-foreground">
					Step 6 of 6 · You&apos;re almost in
				</p>
				<h1 className="font-display mt-2 text-3xl font-semibold tracking-[-0.6px] sm:text-4xl sm:tracking-[-0.8px]">
					Choose how you pay
				</h1>
				<p className="mt-3 text-base leading-6 text-muted-foreground">
					Your profile is ready. Try Pro for {TRIAL_DAYS} days, then
					${PRO_PRICE_USD} a month, or buy Lifetime once.
				</p>
			</div>

			<div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
				{PLAN_CARDS.map((plan) => {
					const thisBusy = submittingPlan === plan.id;
					return (
						<article
							key={plan.id}
							className={cn(
								"flex flex-col rounded-2xl border bg-background p-6 sm:p-7",
								plan.featured
									? "border-brand/50 ring-1 ring-brand/30"
									: "border-border",
							)}
						>
							<div className="flex items-start justify-between gap-3">
								<p className="text-lg font-semibold tracking-[-0.2px] text-foreground">
									{plan.name}
								</p>
								<span className="rounded-full bg-brand/10 px-3 py-1 text-[11px] font-medium tracking-wide text-brand uppercase">
									{plan.badge}
								</span>
							</div>

							<div className="mt-4 flex items-end gap-2.5">
								<span className="mb-1.5 font-display text-2xl font-semibold tracking-[-0.4px] text-muted-foreground line-through">
									{plan.compareAt}
								</span>
								<span className="font-display text-4xl font-semibold tracking-[-0.8px] text-foreground sm:text-5xl sm:tracking-[-0.96px]">
									{plan.price}
								</span>
								<span className="mb-1.5 text-sm text-muted-foreground">
									{plan.period}
								</span>
							</div>

							<p className="mt-3 min-h-18 text-sm leading-6 text-muted-foreground">
								{plan.blurb}
							</p>

							<ul className="mt-6 flex flex-1 flex-col gap-2.5">
								{plan.features.map((feature) => (
									<li
										key={feature}
										className="flex items-start gap-2.5 text-sm leading-5 text-foreground"
									>
										<span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-brand">
											<CheckIcon size={12} weight="bold" />
										</span>
										{feature}
									</li>
								))}
							</ul>

							<div className="mt-8">
								<Button
									size="lg"
									variant={plan.featured ? "default" : "outline"}
									disabled={busy}
									onClick={() => onComplete(plan.id)}
									className={cn(
										"h-11 w-full cursor-pointer text-base font-semibold",
										plan.featured &&
											"bg-brand text-brand-foreground hover:bg-brand/90",
									)}
								>
									{thisBusy ? "Continuing…" : plan.cta}
								</Button>
							</div>
						</article>
					);
				})}
			</div>

			{error ? (
				<p className="mt-6 text-center text-sm text-destructive">{error}</p>
			) : null}
		</div>
	);
}
