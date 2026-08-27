"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";

import { ToolResumePicker } from "@/components/tools/tool-resume-picker";
import { ToolResultPanel } from "@/components/tools/tool-result";
import { ToolStep } from "@/components/tools/tool-step";
import {
	TurnstileWidget,
	type TurnstileWidgetHandle,
} from "@/components/tools/turnstile-widget";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { MixpanelEvent, trackEvent } from "@/lib/mixpanel";
import type { ToolDefinition } from "@/lib/tools/catalog";
import { JOB_CHAR_LIMIT } from "@/lib/tools/constants";
import type { ToolRunResult } from "@/lib/tools/schemas";

type ToolFormProps = {
	tool: ToolDefinition;
	turnstileSiteKey: string;
};

export function ToolForm({ tool, turnstileSiteKey }: ToolFormProps) {
	const [resumeFile, setResumeFile] = useState<File | null>(null);
	const [resumeError, setResumeError] = useState<string | null>(null);
	const [jobText, setJobText] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<ToolRunResult | null>(null);
	const [pending, startTransition] = useTransition();
	const [verifying, setVerifying] = useState(false);
	const turnstileRef = useRef<TurnstileWidgetHandle>(null);
	const resultRef = useRef<HTMLElement>(null);
	const tokenRef = useRef("");
	const waitingForToken = useRef(false);

	const resumeNeeded = tool.resumeRequired;
	const showResume =
		resumeNeeded || tool.slug === "job-description-keyword-extractor";
	const resumeFirst = resumeNeeded;
	const jobReady = jobText.trim().length >= 40;
	const resumeReady = !resumeNeeded || Boolean(resumeFile);
	const formReady = jobReady && resumeReady && !pending && !verifying;

	useEffect(() => {
		if (!result) {
			return;
		}
		resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
	}, [result]);

	function setTurnstileToken(next: string) {
		tokenRef.current = next;
		if (next && waitingForToken.current) {
			waitingForToken.current = false;
			setVerifying(false);
			runTool(next);
		}
	}

	function runTool(turnstileToken: string) {
		setError(null);
		trackEvent(MixpanelEvent.ToolRunStarted, { tool: tool.slug });

		startTransition(async () => {
			try {
				const body = new FormData();
				body.set("tool", tool.slug);
				body.set("jobText", jobText.trim());
				body.set("turnstileToken", turnstileToken);
				if (resumeFile) {
					body.set("resume", resumeFile);
				}

				const response = await fetch("/api/tools/run", {
					method: "POST",
					body,
				});
				const payload = (await response.json()) as {
					error?: string;
					result?: ToolRunResult;
				};
				turnstileRef.current?.reset();
				if (!response.ok || !payload.result) {
					const message =
						payload.error ?? "Could not run this tool. Try again.";
					setError(message);
					trackEvent(MixpanelEvent.ToolRunFailed, {
						tool: tool.slug,
						status: response.status,
					});
					return;
				}
				setResult(payload.result);
				trackEvent(MixpanelEvent.ToolRunCompleted, { tool: tool.slug });
			} catch {
				turnstileRef.current?.reset();
				setError("Network error. Try again.");
				trackEvent(MixpanelEvent.ToolRunFailed, { tool: tool.slug });
			}
		});
	}

	function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!formReady) {
			return;
		}
		if (tokenRef.current) {
			runTool(tokenRef.current);
			return;
		}
		waitingForToken.current = true;
		setVerifying(true);
		turnstileRef.current?.execute();
	}

	const resumeStep = showResume ? (
		<ToolStep
			index={resumeFirst ? 1 : 2}
			title={
				resumeNeeded ? "Upload your resume PDF" : "Resume PDF (optional)"
			}
			done={Boolean(resumeFile)}
		>
			<ToolResumePicker
				required={resumeNeeded}
				file={resumeFile}
				error={resumeError}
				onFile={setResumeFile}
				onError={setResumeError}
			/>
		</ToolStep>
	) : null;

	const jobStep = (
		<ToolStep
			index={resumeFirst || !showResume ? (showResume ? 2 : 1) : 1}
			title="Paste the job description"
			done={jobReady}
		>
			<Textarea
				id="job-text"
				name="job"
				value={jobText}
				onChange={(event) =>
					setJobText(event.target.value.slice(0, JOB_CHAR_LIMIT))
				}
				placeholder="Paste the posting"
				className="max-h-80 min-h-36 overflow-y-auto"
				maxLength={JOB_CHAR_LIMIT}
				required
			/>
			<p className="mt-2 text-[13px] text-muted-foreground">
				{jobText.length}/{JOB_CHAR_LIMIT}
			</p>
		</ToolStep>
	);

	const lastIndex = showResume ? 3 : 2;

	return (
		<div>
			<form onSubmit={onSubmit}>
				<ol className="list-none">
					{resumeFirst ? resumeStep : jobStep}
					{resumeFirst ? jobStep : resumeStep}
					<ToolStep
						index={lastIndex}
						title="Get your result"
						done={Boolean(result)}
						last
					>
						<TurnstileWidget
							ref={turnstileRef}
							siteKey={turnstileSiteKey}
							onToken={setTurnstileToken}
							onExpire={() => {
								tokenRef.current = "";
								if (waitingForToken.current) {
									waitingForToken.current = false;
									setVerifying(false);
									setError("Could not verify. Try again.");
								}
							}}
						/>
						{error ? (
							<p className="mb-3 text-sm text-destructive" role="alert">
								{error}
							</p>
						) : null}
						<Button
							type="submit"
							size="lg"
							className="w-full sm:w-auto"
							disabled={!formReady}
						>
							{pending || verifying ? (
								<>
									<Spinner />
									{verifying ? "Checking" : "Scanning"}
								</>
							) : (
								tool.submitLabel
							)}
						</Button>
					</ToolStep>
				</ol>
			</form>

			{result ? (
				<section
					ref={resultRef}
					className="mt-10 scroll-mt-24 border-t border-border pt-8"
					aria-live="polite"
				>
					<h2 className="font-display text-[22px] leading-7 font-semibold tracking-[-0.4px] text-foreground">
						Your result
					</h2>
					<div className="mt-5">
						<ToolResultPanel slug={tool.slug} result={result} />
					</div>
				</section>
			) : null}
		</div>
	);
}
