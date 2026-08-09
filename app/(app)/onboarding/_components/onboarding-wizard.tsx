"use client";

import { Check } from "@phosphor-icons/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PlanId, type PlanId as PlanIdType } from "@/lib/plans";
import { cn } from "@/lib/utils";

const PLAN_CARDS = [
	{
		id: PlanId.FREE,
		name: "Free",
		price: "Free",
		period: "",
		blurb: "Best for casual applicants who only need about 10–15 CVs a month.",
		features: [
			"Chat-led resume drafting",
			"Career persona profile",
			"PDF export",
			"About 10–15 resumes / month",
		],
		cta: "Continue with Free",
		featured: false,
	},
	{
		id: PlanId.PRO,
		name: "Pro",
		price: "$10",
		period: "/month",
		blurb: "For regular applicants who apply often and need 100+ resumes every month.",
		features: [
			"Everything in Free",
			"Room for heavy application weeks",
			"Hundreds of resume iterations",
			"100+ resumes / month",
		],
		cta: "Continue with Pro",
		featured: true,
	},
] as const;

export function OnboardingWizard() {
	const [submittingPlan, setSubmittingPlan] = useState<PlanIdType | null>(
		null,
	);
	const [error, setError] = useState<string | null>(null);

	async function completeOnboarding(planId: PlanIdType) {
		setError(null);
		setSubmittingPlan(planId);
		try {
			const response = await fetch("/api/onboarding/complete", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ planId }),
			});
			const data = (await response.json()) as {
				redirectUrl?: string;
				error?: string;
			};
			if (!response.ok || !data.redirectUrl) {
				throw new Error(data.error || "Could not finish plan selection");
			}
			window.location.href = data.redirectUrl;
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Something went wrong",
			);
			setSubmittingPlan(null);
		}
	}

	return (
		<div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 py-10 sm:px-6 sm:py-14">
			<div className="mb-10 max-w-lg text-center">
				<p className="text-sm font-medium text-muted-foreground">
					Plan selection
				</p>
				<h1 className="font-display mt-2 text-3xl font-semibold tracking-[-0.6px] sm:text-4xl sm:tracking-[-0.8px]">
					Choose your plan
				</h1>
				<p className="mt-3 text-base leading-6 text-muted-foreground">
					Start free, or go Pro when you&apos;re applying regularly.
				</p>
			</div>

			<div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
				{PLAN_CARDS.map((plan) => {
					const busy = submittingPlan !== null;
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
								{plan.featured ? (
									<span className="rounded-md bg-brand/10 px-2 py-0.5 text-[11px] font-medium tracking-wide text-brand uppercase">
										Recommended
									</span>
								) : null}
							</div>

							<div className="mt-4 flex items-end gap-1">
								<span className="font-display text-4xl font-semibold tracking-[-0.8px] text-foreground sm:text-5xl sm:tracking-[-0.96px]">
									{plan.price}
								</span>
								{plan.period ? (
									<span className="mb-1.5 text-sm text-muted-foreground">
										{plan.period}
									</span>
								) : null}
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
											<Check size={12} weight="bold" />
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
									onClick={() => completeOnboarding(plan.id)}
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
				<p className="mt-6 text-center text-sm text-destructive">
					{error}
				</p>
			) : null}
		</div>
	);
}
