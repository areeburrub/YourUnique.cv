import {
	FREE_RESUMES_LABEL,
	PRO_DISCOUNT_PERCENT,
	PRO_LIST_PRICE_USD,
	PRO_PRICE_USD,
	PRO_RESUMES_LABEL,
} from "@/lib/plans";

export const TRIAL_DAYS = 0;
export const LIFETIME_LIST_PRICE_USD = 250;
export const LIFETIME_PRICE_USD = 150;

function planFeatures(resumesLabel: string) {
	return [
		`${resumesLabel} tailored resumes / month`,
		"Career profile from your resume",
		"Match score vs the job",
		"Cover letter from the same job",
		"PDF export",
	];
}

export const PLAN_COPY = {
	FREE: {
		name: "Free",
		price: "$0",
		compareAt: null,
		period: "forever",
		badge: "Always on",
		blurb: "For the casual job seeker. A few tailored CVs when a posting is actually worth sending.",
		features: planFeatures(FREE_RESUMES_LABEL),
		cta: "Continue free",
	},
	PRO: {
		name: "Pro",
		price: `$${PRO_PRICE_USD}`,
		compareAt: `$${PRO_LIST_PRICE_USD}`,
		period: "/ month",
		badge: `${PRO_DISCOUNT_PERCENT}% off`,
		blurb: "For the regular job seeker. Apply through the month without hitting the cap.",
		features: planFeatures(PRO_RESUMES_LABEL),
		cta: "Get Pro",
	},
} as const;
