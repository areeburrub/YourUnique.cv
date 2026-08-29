import { listPublishedArticles } from "@/lib/db/articles";
import { getSiteUrl } from "@/lib/site";

const PRODUCT_LLMS_TXT = `# YourUnique.cv

> Resume agent. Start from your resume and LinkedIn. Share a job in chat and get a CV written for that role, plus an ATS read.

YourUnique.cv is a web app at https://yourunique.cv. Every job is different, so you should not send the same CV to every posting.

It is not a job board. It does not apply for you. Built by Areeb ur Rub.

## Features

These are included on Free and Pro:

- Career persona: roles, skills, and wins stored as one profile the agent writes from
- Onboarding from a resume upload and an optional LinkedIn profile URL
- Chat with memory: paste a job description, share a LinkedIn job link or JD PDF, ask what to emphasize, or mention something new
- Job-aware drafts: a tailored CV for the role in front of you, already written in the posting's words for work you have
- Agent tool calls you can see (fetch a posting, read the profile, write the resume, update the profile)
- Profile updates in chat: a new cert, job, or win is saved and used next time
- Bring your own template: the look of the uploaded resume is extracted so later drafts can stay in that design
- Template library if you want a different layout
- ATS analysis after that optimized draft: score out of 100, Area / Match table, and biggest gaps. Do not invent experience.
- PDF export
- Version history: a tailored file per role
- Chat, profile, resumes, and templates in the signed-in app

## How it works

1. Upload a current resume and, if you want, a LinkedIn URL. That becomes the persona.
2. Keep the extracted layout, or pick one from the library.
3. In chat, send a JD, ask a question, or add a new fact. The agent writes the CV and updates the profile when you tell it something new.
4. Read the ATS score, area table, and gaps before you send the file.

## Plans

Free forever, no card. Same tools as Pro. Limits are on chat usage, not a resume count. Pro is $8 a month for about 10x more room. Cancel anytime.

- Free: $0 forever. Same features as Pro. Limited monthly usage.
- Pro: $8/month. Same features. About 10x more usage than Free.

Start free or subscribe to Pro at https://yourunique.cv/sign-up, or during onboarding.

## Links

- [Home](https://yourunique.cv/): overview, how it works, and pricing
- [Free Tools](https://yourunique.cv/free-tools): ATS resume checker, job-description keyword extractor, resume vs job match
- [ATS resume checker](https://yourunique.cv/free-tools/ats-resume-checker)
- [Job description keyword extractor](https://yourunique.cv/free-tools/job-description-keyword-extractor)
- [Resume vs job match](https://yourunique.cv/free-tools/resume-job-match)
- [Articles](https://yourunique.cv/articles): featured writing on resumes, ATS, and job search
- [Templates](https://yourunique.cv/templates): built-in resume layouts
- [Sign up](https://yourunique.cv/sign-up)
- [Sign in](https://yourunique.cv/sign-in)
- [Author](https://areeburrub.dev): Areeb ur Rub
- [Contact](mailto:contact@areeburrub.dev): contact@areeburrub.dev
- [llm.txt](https://yourunique.cv/llm.txt): short summary
`;

export async function buildLlmsTxt() {
	const siteUrl = getSiteUrl();
	let articlesBlock = "";

	try {
		const articles = await listPublishedArticles();
		if (articles.length > 0) {
			const items = articles
				.map((article) => {
					const url = `${siteUrl}/articles/${article.slug}`;
					const markdown = `${url}/markdown`;
					return `- [${article.title}](${url}): ${article.description}\n  Markdown: ${markdown}`;
				})
				.join("\n");
			articlesBlock = `\n## Articles\n\nPublished guides. Prefer the markdown URL when quoting.\n\n${items}\n`;
		}
	} catch {
		articlesBlock = "";
	}

	return `${PRODUCT_LLMS_TXT}${articlesBlock}\n## Optional\n\nSigned-in pages (chats, profile, resumes, templates, settings) need an account and are not meant for crawlers.\n`;
}
