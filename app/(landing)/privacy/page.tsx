import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage } from "@/components/landing/legal-page";
import { SITE_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
	title: "Privacy Policy",
	description: `How ${SITE_NAME} collects, uses, and stores your data.`,
	alternates: {
		canonical: "/privacy",
	},
};

export default function PrivacyPage() {
	return (
		<LegalPage
			eyebrow="Legal"
			title="Privacy Policy"
			updated="August 19, 2026"
		>
			<section className="space-y-3">
				<h2>Who we are</h2>
				<p>
					{SITE_NAME} is a resume agent at{" "}
					<Link href="/">yourunique.cv</Link>. It is built by Areeb ur
					Rub. Questions:{" "}
					<a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>.
				</p>
			</section>

			<section className="space-y-3">
				<h2>What we collect</h2>
				<ul>
					<li>
						Account details from Clerk: email, name, and sign-in
						info.
					</li>
					<li>
						Resumes you upload, optional LinkedIn URLs, notes, and
						the career profile we build from them.
					</li>
					<li>
						Chat messages, job descriptions, templates, and
						generated resume files.
					</li>
					<li>
						Usage so we can apply plan limits.
					</li>
					<li>
						Payment details handled by Dodo Payments. We store
						customer and subscription IDs, not your full card
						number.
					</li>
					<li>
						Product analytics in production (Mixpanel): events like
						sign-up, onboarding, and checkout. Local use is skipped.
					</li>
				</ul>
			</section>

			<section className="space-y-3">
				<h2>How we use it</h2>
				<p>
					We use this to run the product: generate tailored resumes,
					compile PDFs, bill the plan you chose, and see what is
					broken. We do not sell your data. We do not use your resume
					or chat history to train public models.
				</p>
			</section>

			<section className="space-y-3">
				<h2>Who else sees it</h2>
				<p>
					Processors that help run the app: Clerk (auth), Dodo
					Payments (billing), OpenRouter (language models), Cloudflare
					R2 (file storage), and Trigger.dev (PDF compile). They only
					get what they need to do that job.
				</p>
			</section>

			<section className="space-y-3">
				<h2>How long we keep it</h2>
				<p>
					We keep your account and files while the account is open.
					Email {SITE_EMAIL} if you want your account and stored
					resumes deleted.
				</p>
			</section>

			<section className="space-y-3">
				<h2>Contact</h2>
				<p>
					For privacy requests, write to{" "}
					<a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>.
				</p>
			</section>
		</LegalPage>
	);
}
