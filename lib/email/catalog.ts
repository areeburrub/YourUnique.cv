export const EMAIL_FROM =
	process.env.EMAIL_FROM ?? "YourUnique.cv <hello@emails.yourunique.cv>";
export const EMAIL_REPLY_TO =
	process.env.EMAIL_REPLY_TO ?? "contact@areeburrub.dev";
export const EMAIL_LOGO_URL =
	"https://storage.yourunique.cv/static/icon-logo-yourunique.cv.png";

export type EmailPreference = "important" | "promotional";

export type EmailTemplateDef = {
	alias: string;
	name: string;
	subject: string;
	preheader: string;
	headline: string;
	paragraphs: string[];
	ctaLabel: string;
	preference: EmailPreference;
};

export const TEMPLATE_VARIABLES = [
	{ key: "NAME", type: "string" as const, fallbackValue: "there" },
	{
		key: "CTA_URL",
		type: "string" as const,
		fallbackValue: "https://yourunique.cv/new-chat",
	},
	{
		key: "UNSUBSCRIBE_URL",
		type: "string" as const,
		fallbackValue: "https://yourunique.cv/settings",
	},
	{ key: "COMPANY", type: "string" as const, fallbackValue: "that company" },
	{ key: "ROLE", type: "string" as const, fallbackValue: "the role" },
	{ key: "DAYS_LEFT", type: "string" as const, fallbackValue: "a few" },
	{ key: "SCORE", type: "string" as const, fallbackValue: "your" },
	{ key: "RESUME_COUNT", type: "string" as const, fallbackValue: "a few" },
] as const;

export const EMAIL_TEMPLATES: EmailTemplateDef[] = [
	{
		alias: "yucv-profile-ready",
		name: "Profile ready",
		subject: "Your profile is ready. Paste a job.",
		preheader: "Paste a job description or LinkedIn job link. We write the CV.",
		headline: "Your profile is ready. Paste a job.",
		paragraphs: [
			"Hi {{{NAME}}}. We built your career profile from your resume. The next step is one posting.",
			"Paste a job description or a LinkedIn job link in chat. We rewrite the CV in that posting's words, for work you already have.",
		],
		ctaLabel: "Customize your CV",
		preference: "important",
	},
	{
		alias: "yucv-pdf-ready",
		name: "CV PDF ready",
		subject: "Your {{{COMPANY}}} CV is ready",
		preheader: "The PDF for {{{ROLE}}} is in your account.",
		headline: "Your {{{COMPANY}}} CV is ready",
		paragraphs: [
			"Hi {{{NAME}}}. The tailored file for {{{ROLE}}} finished compiling.",
			"Download it and send that version, not yesterday's generic resume.",
		],
		ctaLabel: "Download PDF",
		preference: "important",
	},
	{
		alias: "yucv-onboarding-stuck",
		name: "Finish setup",
		subject: "Your resume is uploaded. Finish the profile.",
		preheader: "A few minutes left and chat can write CVs from your history.",
		headline: "Finish setup so we can write the CV",
		paragraphs: [
			"Hi {{{NAME}}}. You started a profile. We still need the last steps before chat can tailor a resume.",
			"A resume or a LinkedIn URL is enough. Notes are optional.",
		],
		ctaLabel: "Continue setup",
		preference: "promotional",
	},
	{
		alias: "yucv-first-job",
		name: "Paste the first job",
		subject: "Paste a job description. We'll write the CV.",
		preheader: "One posting. That's the whole product.",
		headline: "Paste the first job",
		paragraphs: [
			"Hi {{{NAME}}}. Your profile is sitting unused. Chat needs a job description or a LinkedIn job link.",
			"We write the CV in that posting's words. We will not invent skills you have not used.",
		],
		ctaLabel: "Customize your CV",
		preference: "promotional",
	},
	{
		alias: "yucv-quiet-d1",
		name: "Quiet Q1 · Profile is waiting",
		subject: "Your profile is waiting. Paste a job.",
		preheader: "Two days quiet. One paste gets a tailored CV.",
		headline: "Your profile is waiting. Paste a job.",
		paragraphs: [
			"Hi {{{NAME}}}. Nothing moved on your account for two days. The career profile is still there.",
			"Paste a job description or a LinkedIn job link. We'll write the CV for that role.",
		],
		ctaLabel: "Customize your CV",
		preference: "promotional",
	},
	{
		alias: "yucv-quiet-d2",
		name: "Quiet Q2 · Same CV",
		subject: "The same CV for every posting is why they bounce",
		preheader: "Each job is different. The file should be too.",
		headline: "Don't send the same CV twice",
		paragraphs: [
			"Hi {{{NAME}}}. Recruiters read for the posting in front of them. A generic file looks like you didn't.",
			"Paste the next job. We rewrite from your profile, in that posting's words.",
		],
		ctaLabel: "Customize your CV",
		preference: "promotional",
	},
	{
		alias: "yucv-quiet-d3",
		name: "Quiet Q3 · One paste",
		subject: "Paste a JD or a LinkedIn job link",
		preheader: "You don't have to rewrite it by hand.",
		headline: "One paste. That's the step.",
		paragraphs: [
			"Hi {{{NAME}}}. You don't draft from a blank page. Drop in the job description or a LinkedIn jobs URL.",
			"We fetch the posting if you send a link, then write the CV from your profile.",
		],
		ctaLabel: "Customize your CV",
		preference: "promotional",
	},
	{
		alias: "yucv-quiet-d4",
		name: "Quiet Q4 · Next posting",
		subject: "The next CV takes two minutes",
		preheader: "First file or next file. Same paste.",
		headline: "The next CV takes two minutes",
		paragraphs: [
			"Hi {{{NAME}}}. If you haven't tailored one yet, start with the job you would apply to today.",
			"If you already did {{{COMPANY}}}, paste the next posting. Don't reuse that PDF.",
		],
		ctaLabel: "Customize your CV",
		preference: "promotional",
	},
	{
		alias: "yucv-quiet-d5",
		name: "Quiet Q5 · Posting's words",
		subject: "We write it in the posting's words",
		preheader: "For work you already have. Gaps stay gaps.",
		headline: "Written in the job's words, for work you have",
		paragraphs: [
			"Hi {{{NAME}}}. The draft uses phrases from the posting where they match your history.",
			"Missing requirements stay listed as gaps. We will not invent work you haven't done.",
		],
		ctaLabel: "Customize your CV",
		preference: "promotional",
	},
	{
		alias: "yucv-quiet-d6",
		name: "Quiet Q6 · Yesterday's file",
		subject: "Don't send yesterday's file to today's job",
		preheader: "A new posting needs a new CV.",
		headline: "Don't send yesterday's file to today's job",
		paragraphs: [
			"Hi {{{NAME}}}. If you're applying this week, each posting should get its own file.",
			"Paste the one that's open. We'll tailor it before you hit send.",
		],
		ctaLabel: "Customize your CV",
		preference: "promotional",
	},
	{
		alias: "yucv-quiet-d7",
		name: "Quiet Q7 · LinkedIn URL",
		subject: "A LinkedIn job URL is enough",
		preheader: "No need to copy the whole description.",
		headline: "A LinkedIn job URL is enough",
		paragraphs: [
			"Hi {{{NAME}}}. You don't need to paste a wall of text. A LinkedIn jobs link works.",
			"We fetch the posting, then write the CV from your profile.",
		],
		ctaLabel: "Customize your CV",
		preference: "promotional",
	},
	{
		alias: "yucv-quiet-d8",
		name: "Quiet Q8 · One posting",
		subject: "One posting. That's the whole product.",
		preheader: "Paste the job. We write the CV.",
		headline: "One posting. That's the product.",
		paragraphs: [
			"Hi {{{NAME}}}. Open chat, paste a job description or a LinkedIn link, get a PDF.",
		],
		ctaLabel: "Customize your CV",
		preference: "promotional",
	},
	{
		alias: "yucv-quiet-d9",
		name: "Quiet Q9 · No invented work",
		subject: "We won't invent work you haven't done",
		preheader: "Gaps stay gaps. Your history stays yours.",
		headline: "We won't invent work you haven't done",
		paragraphs: [
			"Hi {{{NAME}}}. If a posting asks for something that isn't in your profile, it stays a gap.",
			"What we do is rewrite the work you already have, in that job's words.",
		],
		ctaLabel: "Customize your CV",
		preference: "promotional",
	},
	{
		alias: "yucv-quiet-d10",
		name: "Quiet Q10 · Last note",
		subject: "Last note. The chat is here when the next posting shows up.",
		preheader: "We'll stop mailing. Your profile stays.",
		headline: "Last note from us for now",
		paragraphs: [
			"Hi {{{NAME}}}. We'll stop these reminders. Your career profile is still in the account.",
			"When the next posting shows up, paste it in chat. Unsubscribe anytime if you want silence sooner.",
		],
		ctaLabel: "Customize your CV",
		preference: "promotional",
	},
	{
		alias: "yucv-lead-score",
		name: "Free-tool follow-up",
		subject: "Score was {{{SCORE}}}/100 for that posting",
		preheader: "We can rewrite the CV for that same job. Free to start, no card.",
		headline: "Score was {{{SCORE}}}/100 for that posting",
		paragraphs: [
			"You ran a free check on YourUnique.cv. The rewrite is the part that actually changes the file.",
			"Start free, no card. Paste that same job in chat and we write a CV from your history, in the posting's words.",
		],
		ctaLabel: "Rewrite this CV",
		preference: "promotional",
	},
	{
		alias: "yucv-pricing-free",
		name: "Pricing · free plan",
		subject: "YourUnique.cv now have a FREE plan 🎉",
		preheader: "No trial clock. Keep tailoring CVs. No card.",
		headline: "YourUnique.cv now have a FREE plan 🎉",
		paragraphs: [
			"Hi {{{NAME}}}. That's the news. We dropped the trial. YourUnique.cv is free, and it stays on.",
			"If you were on trial, you're already there. Free stays on, no card. Paste the next job and keep going. Pro is $8 a month if you start applying every week.",
		],
		ctaLabel: "Paste a job",
		preference: "important",
	},
	{
		alias: "yucv-limit-daily",
		name: "Daily usage limit",
		subject: "Today's tailored-CV limit is used",
		preheader: "Chat opens again at midnight UTC. Pro is $8/month if you need more today.",
		headline: "Today's tailored-CV limit is used",
		paragraphs: [
			"Hi {{{NAME}}}. That's the cap until midnight UTC. Chat won't write another CV until then.",
			"Pro is $8 a month if you have more postings tonight. If you're already on Pro, reply to this email and we'll add more.",
		],
		ctaLabel: "Get Pro",
		preference: "important",
	},
	{
		alias: "yucv-limit-monthly",
		name: "Monthly usage limit",
		subject: "This month's tailored-CV limit is used",
		preheader: "The 30-day cap is full. Pro is $8/month for a higher one.",
		headline: "This month's tailored-CV limit is used",
		paragraphs: [
			"Hi {{{NAME}}}. That's the rolling 30-day cap on tailored CVs.",
			"Pro is $8 a month if you want more this month. If you're already on Pro, reply to this email and we'll add more.",
		],
		ctaLabel: "Get Pro",
		preference: "important",
	},
];

export const EMAIL_TEMPLATE_BY_ALIAS = Object.fromEntries(
	EMAIL_TEMPLATES.map((template) => [template.alias, template]),
) as Record<string, EmailTemplateDef>;

export const QUIET_DRIP_ALIASES = [
	"yucv-quiet-d1",
	"yucv-quiet-d2",
	"yucv-quiet-d3",
	"yucv-quiet-d4",
	"yucv-quiet-d5",
	"yucv-quiet-d6",
	"yucv-quiet-d7",
	"yucv-quiet-d8",
	"yucv-quiet-d9",
	"yucv-quiet-d10",
] as const;

export type QuietDripAlias = (typeof QUIET_DRIP_ALIASES)[number];
