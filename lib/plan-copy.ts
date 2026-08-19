import { PRO_MONTHLY_RESUMES_LABEL } from "@/lib/plans";

export const TRIAL_DAYS = 7;
export const PRO_LIST_PRICE_USD = 10;
export const PRO_PRICE_USD = 5;
export const LIFETIME_LIST_PRICE_USD = 250;
export const LIFETIME_PRICE_USD = 150;

export const PLAN_COPY = {
	PRO: {
		name: "Pro",
		price: `$${PRO_PRICE_USD}`,
		compareAt: `$${PRO_LIST_PRICE_USD}`,
		period: "/month",
		badge: "50% off",
		blurb: `Try it for ${TRIAL_DAYS} days. Then $${PRO_PRICE_USD} every month.`,
		features: [
			"Career profile from your resume",
			`${PRO_MONTHLY_RESUMES_LABEL} tailored resumes / month`,
			"Match score and gaps vs the job",
			"PDF export",
		],
		cta: `Start ${TRIAL_DAYS}-day trial`,
	},
	LIFETIME: {
		name: "Lifetime",
		price: `$${LIFETIME_PRICE_USD}`,
		compareAt: `$${LIFETIME_LIST_PRICE_USD}`,
		period: "once",
		badge: "40% off",
		blurb: "Pay once. Keep every feature and update.",
		features: [
			"Everything in Pro",
			"Lifetime access to every feature",
			"All future updates",
			"No monthly billing",
		],
		cta: "Get lifetime access",
	},
} as const;
