import { TRIAL_DAYS } from "@/lib/plan-copy";
import { SITE_NAME } from "@/lib/site";

export const FREE_TOOL_PATH = "/free-tools";
export const FREE_TOOL_NAME = "Free Tools";

export const TOOL_SLUGS = [
	"ats-resume-checker",
	"job-description-keyword-extractor",
	"resume-job-match",
] as const;

export type ToolSlug = (typeof TOOL_SLUGS)[number];

export type ToolFaq = {
	question: string;
	answer: string;
};

export type ToolDefinition = {
	slug: ToolSlug;
	path: string;
	name: string;
	seoTitle: string;
	h1: string;
	eyebrow: string;
	description: string;
	intro: string;
	keywords: string[];
	resumeRequired: boolean;
	jobRequired: boolean;
	submitLabel: string;
	howToName: string;
	steps: string[];
	faq: ToolFaq[];
	ctaHeadline: string;
	ctaBody: string;
	ctaButton: string;
};

export const TOOLS: Record<ToolSlug, ToolDefinition> = {
	"ats-resume-checker": {
		slug: "ats-resume-checker",
		path: `${FREE_TOOL_PATH}/ats-resume-checker`,
		name: "ATS Resume Checker",
		seoTitle: "Free ATS Resume Checker",
		h1: "Free ATS resume checker",
		eyebrow: FREE_TOOL_NAME,
		description:
			"Upload your resume PDF and paste a job description. Get an ATS match score, missing keywords, and the real gaps before you apply.",
		intro: `A quick read of your current file against one posting. ${SITE_NAME} then writes a CV for that role from your profile, in the posting's words, and scores the new draft.`,
		keywords: [
			"free tools",
			"ATS resume checker",
			"resume checker",
			"ATS score",
			"ATS friendly resume",
			"resume keyword match",
			"applicant tracking system checker",
		],
		resumeRequired: true,
		jobRequired: true,
		submitLabel: "Check ATS match",
		howToName: "Check a resume against a job description",
		steps: [
			"Upload the resume PDF you would send today",
			"Paste the job description",
			"Read the score, keyword gaps, and what is already a match",
		],
		faq: [
			{
				question: "Is this the same score Workday or Greenhouse would give?",
				answer:
					"No. It is a keyword and requirement read of your text against this posting, not a vendor ATS number. Use it to see missing phrases and real gaps before you send the file.",
			},
			{
				question: "Do I need an account?",
				answer: `The checker is free and does not need an account. To rewrite the resume for this job, start a ${TRIAL_DAYS}-day trial on ${SITE_NAME}. No card.`,
			},
			{
				question: "Will you invent skills I do not have?",
				answer:
					"No. Missing items stay listed as gaps. The paid product follows the same rule when it writes a tailored CV.",
			},
			{
				question: "Do you store the resume I upload?",
				answer:
					"The free tools scan the PDF to produce this result. We do not save it to an account. Sign up if you want a profile, chat history, and PDFs kept.",
			},
		],
		ctaHeadline: "Want a CV for this job?",
		ctaBody: "7-day trial. No card.",
		ctaButton: "Start free trial",
	},
	"job-description-keyword-extractor": {
		slug: "job-description-keyword-extractor",
		path: `${FREE_TOOL_PATH}/job-description-keyword-extractor`,
		name: "Job Description Keyword Extractor",
		seoTitle: "Free Job Description Keyword Extractor",
		h1: "Job description keyword extractor",
		eyebrow: FREE_TOOL_NAME,
		description:
			"Paste a job description and pull the resume keywords ATS will scan for: must-haves, tools, and nice-to-haves. Optional: upload your resume PDF to see what is missing.",
		intro: `Use this when you are still writing the resume yourself. When you want those phrases written into a CV for this posting, ${SITE_NAME} does that in chat.`,
		keywords: [
			"free tools",
			"job description keywords",
			"resume keywords from job description",
			"keyword scanner resume",
			"ATS keywords",
			"job description keyword extractor",
		],
		resumeRequired: false,
		jobRequired: true,
		submitLabel: "Extract keywords",
		howToName: "Extract resume keywords from a job description",
		steps: [
			"Paste the job description",
			"Optionally upload your resume PDF to mark missing keywords",
			"Copy the must-haves and tools into your draft, or rewrite the whole CV in chat",
		],
		faq: [
			{
				question: "Which keywords should I put on my resume?",
				answer:
					"Must-haves and tools that are already true for you. Do not add a skill you do not have. The extractor lists phrases from the posting; it does not tell you to fake them.",
			},
			{
				question: "Why upload my resume too?",
				answer:
					"Then we can scan the PDF and mark which posting keywords are already in your file and which are still missing. That is the list worth fixing.",
			},
			{
				question: "Can you insert these keywords for me?",
				answer: `Yes, on ${SITE_NAME}. Start a ${TRIAL_DAYS}-day trial, upload your resume, and paste the same job in chat. The agent writes a tailored CV using the posting's words for work you already have.`,
			},
		],
		ctaHeadline: "Want a CV for this job?",
		ctaBody: "7-day trial. No card.",
		ctaButton: "Start free trial",
	},
	"resume-job-match": {
		slug: "resume-job-match",
		path: `${FREE_TOOL_PATH}/resume-job-match`,
		name: "Resume vs Job Match",
		seoTitle: "Free Resume vs Job Match Checker",
		h1: "Resume vs job match",
		eyebrow: FREE_TOOL_NAME,
		description:
			"Upload your resume PDF and paste a job description. See overlap, skills gaps, and a fit score before you spend time applying.",
		intro: `A fit read for one posting. If you apply, ${SITE_NAME} can write the CV for that role so the overlap is the work you already have, written in the job's words.`,
		keywords: [
			"free tools",
			"resume job match",
			"skills gap analysis resume",
			"does my resume match the job description",
			"resume match score",
			"job description match",
		],
		resumeRequired: true,
		jobRequired: true,
		submitLabel: "Check job match",
		howToName: "Match a resume to a job description",
		steps: [
			"Upload your resume PDF",
			"Paste the job description",
			"Read the fit score, overlapping skills, and gaps you should not claim",
		],
		faq: [
			{
				question: "What does a weak match mean?",
				answer:
					"The posting asks for work or tools that are not in your resume text. That can be a real gap, or wording you have not used yet. We will not tell you to claim experience you did not list.",
			},
			{
				question: "Should I still apply?",
				answer:
					"Use the overlapping skills and the gaps. If the gaps are tools you have not used, this may not be the role. If they are phrases you can honestly add, tailor the resume first.",
			},
			{
				question: "How do I close the gaps?",
				answer: `Start a ${TRIAL_DAYS}-day trial on ${SITE_NAME}. The agent writes a CV for this posting from your profile. Gaps that are not in your history stay listed as gaps.`,
			},
		],
		ctaHeadline: "Want a CV for this job?",
		ctaBody: "7-day trial. No card.",
		ctaButton: "Start free trial",
	},
};

export const TOOL_LIST = TOOL_SLUGS.map((slug) => TOOLS[slug]);

export function isToolSlug(value: string): value is ToolSlug {
	return (TOOL_SLUGS as readonly string[]).includes(value);
}

export function toolSignupHref(slug: ToolSlug) {
	return `/sign-up?from=free-tools-${slug}`;
}
