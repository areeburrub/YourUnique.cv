import {
	PRO_DISCOUNT_PERCENT,
	PRO_LIST_PRICE_USD,
	PRO_PRICE_USD,
	PRO_USAGE_MULTIPLIER,
} from "@/lib/plans";

export const TRIAL_DAYS = 0;
export const LIFETIME_LIST_PRICE_USD = 250;
export const LIFETIME_PRICE_USD = 150;

const SHARED_FEATURES = [
	"Career profile from your resume",
	"Match score vs the job",
	"Cover letter from the same job",
	"PDF export",
] as const;

export const PLAN_COPY = {
	FREE: {
		name: "Free",
		price: "$0",
		compareAt: null,
		period: "forever",
		badge: "Always on",
		blurb: "For the casual job seeker. Tailor a CV when a posting is actually worth sending.",
		features: ["Limited monthly usage", ...SHARED_FEATURES],
		cta: "Continue free",
	},
	PRO: {
		name: "Pro",
		price: `$${PRO_PRICE_USD}`,
		compareAt: `$${PRO_LIST_PRICE_USD}`,
		period: "/ month",
		badge: `${PRO_DISCOUNT_PERCENT}% off`,
		blurb: "For an active search. Keep tailoring as you apply this month.",
		features: [
			`About ${PRO_USAGE_MULTIPLIER}x more usage than Free`,
			...SHARED_FEATURES,
		],
		cta: "Get Pro",
	},
} as const;
