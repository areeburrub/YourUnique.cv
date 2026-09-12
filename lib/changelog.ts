export type ChangelogKind = "new" | "improved" | "fixed";

export type ChangelogItem = {
	kind: ChangelogKind;
	text: string;
};

export type ChangelogRelease = {
	version: string;
	date: string;
	title: string;
	items: ChangelogItem[];
};

export const CHANGELOG: ChangelogRelease[] = [
	{
		version: "0.4.0",
		date: "2026-09-13",
		title: "Scroll the job list",
		items: [
			{
				kind: "new",
				text: "Job Radar loads 10 roles at a time as you scroll.",
			},
		],
	},
	{
		version: "0.3.1",
		date: "2026-09-12",
		title: "Matches that would actually hire you",
		items: [
			{
				kind: "improved",
				text: "Job Radar prefers roles in your city. Remote jobs only stay on the board if the posting looks like it hires where you live — a skills match is not enough.",
			},
			{
				kind: "improved",
				text: "Job Radar match details expand on the card. The first role starts open, and opening another closes the rest.",
			},
		],
	},
	{
		version: "0.3.0",
		date: "2026-09-11",
		title: "Job Radar in chat, and files you can actually send",
		items: [
			{
				kind: "new",
				text: "A public changelog lives in the site footer. New product versions will show up there.",
			},
			{
				kind: "new",
				text: "Ask chat what's on Job Radar. Pro can filter and shortlist roles already on your board. Free gets an upgrade card, not a fake list.",
			},
			{
				kind: "new",
				text: "Log in from the Job Radar page and we take you there after you sign in, not to a blank chat.",
			},
			{
				kind: "improved",
				text: "The jobs-ready email lists the same unblurred matches you can open on the board.",
			},
			{
				kind: "improved",
				text: "Downloaded PDFs are named like Areeb ur Rub - Resume - 110920261436.pdf. Company names stay off the filename.",
			},
			{
				kind: "fixed",
				text: "Saving Radar preferences no longer wipes a longer Job search section the profile agent already wrote.",
			},
		],
	},
	{
		version: "0.2.0",
		date: "2026-09-09",
		title: "Job Radar",
		items: [
			{
				kind: "new",
				text: "Job Radar matches your profile against public career pages and scores the fit.",
			},
			{
				kind: "new",
				text: "Pro gets a daily refresh. Free can see a short teaser list.",
			},
			{
				kind: "new",
				text: "Set location, remote/hybrid/onsite, and avoid-rules so later searches stay on target.",
			},
		],
	},
	{
		version: "0.1.0",
		date: "2026-08-08",
		title: "YourUnique.cv",
		items: [
			{
				kind: "new",
				text: "Chat with an agent that knows your career story. Paste a job, get a CV written for that role.",
			},
			{
				kind: "new",
				text: "Onboard from a resume PDF and an optional LinkedIn URL.",
			},
			{
				kind: "new",
				text: "Templates, PDF export, and a version per role.",
			},
			{
				kind: "new",
				text: "Free ATS checker, keyword extractor, and resume vs job match on the public tools pages.",
			},
			{
				kind: "new",
				text: "Free forever, no card. Pro is $8 a month for more chat usage.",
			},
		],
	},
];

export function latestChangelogVersion() {
	return CHANGELOG[0]?.version ?? "0.1.0";
}

export function formatChangelogDate(isoDate: string) {
	const date = new Date(`${isoDate}T12:00:00+05:30`);
	return date.toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}
