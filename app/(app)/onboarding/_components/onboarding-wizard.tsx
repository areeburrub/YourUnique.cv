"use client";

import {
	CheckIcon,
	FileArrowUpIcon,
	LinkedinLogoIcon,
	TrashIcon,
} from "@phosphor-icons/react";
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
import { isLinkedInProfileUrl } from "@/lib/linkedin-profile";
import { ONBOARDING_UPLOAD_ACCEPT } from "@/lib/uploads";
import { cn } from "@/lib/utils";

import { OnboardingGenerateStep } from "./onboarding-generate-step";
import { OnboardingTemplateStep } from "./onboarding-template-step";

type WizardStep = "resume" | "notes" | "generate" | "template" | "plan";

type GenerateStage = "analyzing" | "linkedin" | "writing" | "done";

function startingGenerateStage(hasResume: boolean, hasLinkedIn: boolean): GenerateStage {
	if (hasResume) {
		return "analyzing";
	}
	if (hasLinkedIn) {
		return "linkedin";
	}
	return "writing";
}

const PLAN_CARDS = [
	{
		id: PlanId.TRIAL,
		...PLAN_COPY.TRIAL,
		featured: false,
	},
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
		eyebrow: "Step 1 of 5",
		title: "Upload your resume & LinkedIn",
		description:
			"Add at least one so we have something to build your career profile from.",
	},
	notes: {
		eyebrow: "Step 2 of 5",
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
	initialProfileReady: boolean;
};

export function OnboardingWizard({
	initialStep,
	initialResumeFileId,
	initialResumeFilename,
	initialResumeMediaType,
	initialLinkedinUrl,
	initialIntroduction,
	initialProfileReady,
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
	const [profileReady, setProfileReady] = useState(initialProfileReady);
	const [submittingPlan, setSubmittingPlan] = useState<PlanIdType | null>(
		null,
	);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const generateStartedRef = useRef(false);
	const pendingStartedRef = useRef(false);
	const generatedInputsRef = useRef({
		fileId: initialResumeFileId,
		linkedinUrl: initialLinkedinUrl.trim(),
		notes: initialIntroduction.trim(),
	});

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
					setStep("resume");
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
				setGenerateStage(
					startingGenerateStage(
						Boolean(fileId),
						Boolean(linkedinUrl.trim()),
					),
				);
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

	async function goToNotes() {
		const trimmed = linkedinUrl.trim();
		if (!fileId && !trimmed) {
			setError("Add your resume or LinkedIn to continue.");
			return;
		}
		if (trimmed && !isLinkedInProfileUrl(trimmed)) {
			setError("Enter a valid LinkedIn profile URL, or leave it blank.");
			return;
		}
		setError(null);
		setSavingStep(true);
		try {
			await saveOnboardingProgress({
				step: "resume",
				resumeFileId: fileId,
				linkedinUrl: trimmed,
			});
			trackEvent(MixpanelEvent.OnboardingLinkedInSaved, {
				has_resume: Boolean(fileId),
				skipped: !trimmed,
			});
			setStep("notes");
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Could not save your info",
			);
		} finally {
			setSavingStep(false);
		}
	}

	function goBackToNotes() {
		generateStartedRef.current = false;
		setStep("notes");
	}

	async function startGenerate(skipNotes = false) {
		if (!fileId && !linkedinUrl.trim() && !notes.trim()) {
			setError("Add your resume, LinkedIn, or notes to continue.");
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

		const nextInputs = {
			fileId,
			linkedinUrl: linkedinUrl.trim(),
			notes: introduction,
		};
		if (
			profileReady &&
			nextInputs.fileId === generatedInputsRef.current.fileId &&
			nextInputs.linkedinUrl === generatedInputsRef.current.linkedinUrl &&
			nextInputs.notes === generatedInputsRef.current.notes
		) {
			setStep("template");
			return;
		}

		generateStartedRef.current = true;
		setProfilePreview("");
		setGenerateStage(
			startingGenerateStage(Boolean(fileId), Boolean(linkedinUrl.trim())),
		);
		setStep("generate");
		void runGenerate();
	}

	async function runGenerate() {
		setError(null);
		const hasResume = Boolean(fileId);
		const hasLinkedIn = Boolean(linkedinUrl.trim());
		setGenerateStage(startingGenerateStage(hasResume, hasLinkedIn));
		setProfilePreview("");
		trackEvent(MixpanelEvent.OnboardingProfileGenerationStarted, {
			has_linkedin: hasLinkedIn,
			has_notes: Boolean(notes.trim()),
		});

		let linkedinTimer: ReturnType<typeof setTimeout> | null = null;
		if (hasResume && hasLinkedIn) {
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

			generatedInputsRef.current = {
				fileId,
				linkedinUrl: linkedinUrl.trim(),
				notes: notes.trim(),
			};
			setProfileReady(true);
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
			} else if (planId === PlanId.TRIAL) {
				trackEvent(
					MixpanelEvent.TrialStarted,
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
				hasResume={Boolean(fileId)}
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
				onBack={goBackToNotes}
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
	const canReuseProfile =
		profileReady &&
		fileId === generatedInputsRef.current.fileId &&
		linkedinUrl.trim() === generatedInputsRef.current.linkedinUrl &&
		notes.trim() === generatedInputsRef.current.notes;

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
				<div className="flex flex-col gap-6">
					<div className="flex flex-col gap-2.5">
						<Label>Resume</Label>

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
								className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl border border-dashed border-border bg-surface-subtle/30 px-6 py-8 text-center transition-colors hover:border-brand/40 hover:bg-surface-subtle/50 disabled:cursor-not-allowed disabled:opacity-60"
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
										<span className="flex size-14 items-center justify-center rounded-[20px] bg-pastel-blush text-brand">
											<FileArrowUpIcon
												size={26}
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
					</div>

					<div className="flex flex-col gap-2.5">
						<Label htmlFor="linkedin-url">LinkedIn</Label>
						<div className="relative">
							<LinkedinLogoIcon
								size={18}
								weight="fill"
								className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground"
							/>
							<Input
								id="linkedin-url"
								type="url"
								placeholder="https://www.linkedin.com/in/you"
								value={linkedinUrl}
								onChange={(event) =>
									setLinkedinUrl(event.target.value)
								}
								className="h-11 pl-10"
							/>
						</div>
					</div>

					<div className="mt-1 flex justify-end">
						<Button
							size="lg"
							disabled={uploading || savingStep}
							onClick={() => void goToNotes()}
							className="cursor-pointer"
						>
							{savingStep ? <Spinner className="size-4" /> : null}
							Continue
						</Button>
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
							onClick={() => setStep("resume")}
							className="cursor-pointer"
						>
							Back
						</Button>
						<div className="flex gap-2">
							{canReuseProfile ? null : (
								<Button
									type="button"
									variant="outline"
									disabled={savingStep}
									onClick={() => void startGenerate(true)}
									className="cursor-pointer"
								>
									Skip
								</Button>
							)}
							<Button
								type="button"
								disabled={savingStep}
								onClick={() => void startGenerate(false)}
								className="cursor-pointer"
							>
								{savingStep ? <Spinner className="size-4" /> : null}
								{canReuseProfile ? "Continue" : "Build my profile"}
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
		<div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 py-10 sm:px-6 sm:py-14">
			<div className="mb-10 max-w-lg text-center">
				<p className="text-sm font-medium text-muted-foreground">
					Step 5 of 5 · You&apos;re almost in
				</p>
				<h1 className="font-display mt-2 text-3xl font-semibold tracking-[-0.6px] sm:text-4xl sm:tracking-[-0.8px]">
					Choose a plan
				</h1>
				<p className="mt-3 text-base leading-6 text-muted-foreground">
					Your profile is ready. Start a {TRIAL_DAYS}-day trial with
					no card, or subscribe for ${PRO_PRICE_USD} a month.
				</p>
			</div>

			<div className="grid w-full grid-cols-1 items-stretch gap-4 lg:grid-cols-3 lg:gap-5">
				{PLAN_CARDS.map((plan) => {
					const thisBusy = submittingPlan === plan.id;
					return (
						<article
							key={plan.id}
							className={cn(
								"flex min-w-0 flex-col rounded-2xl border bg-background p-5 ring-1 sm:p-6",
								plan.featured
									? "border-brand/50 ring-brand/30"
									: "border-border ring-transparent",
							)}
						>
							<div className="flex items-start justify-between gap-2">
								<p className="text-lg font-semibold tracking-[-0.2px] text-foreground">
									{plan.name}
								</p>
								<span className="shrink-0 rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-medium tracking-wide text-brand uppercase">
									{plan.badge}
								</span>
							</div>

							<div className="mt-4 flex flex-wrap items-end gap-x-2 gap-y-1">
								{"compareAt" in plan && plan.compareAt ? (
									<span className="mb-1 font-display text-xl font-semibold tracking-[-0.4px] text-muted-foreground line-through">
										{plan.compareAt}
									</span>
								) : null}
								<span className="font-display text-[40px] leading-none font-semibold tracking-[-0.8px] text-foreground">
									{plan.price}
								</span>
								<span className="mb-1 text-sm text-muted-foreground">
									{plan.period}
								</span>
							</div>

							<p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">
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
										<span className="min-w-0">{feature}</span>
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
										"h-11 w-full cursor-pointer text-sm font-semibold sm:text-base",
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
