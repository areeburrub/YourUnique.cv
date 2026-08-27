import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage } from "@/components/landing/legal-page";
import { SITE_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
	title: "Terms of Service",
	description: `Terms for using ${SITE_NAME}.`,
	alternates: {
		canonical: "/terms",
	},
};

export default function TermsPage() {
	return (
		<LegalPage
			eyebrow="Legal"
			title="Terms of Service"
			updated="August 24, 2026"
		>
			<section className="space-y-3">
				<h2>The service</h2>
				<p>
					{SITE_NAME} is a web app that writes a resume for a specific
					job from your career profile. It is not a job board and it
					does not apply for you. By using it, you agree to these
					terms.
				</p>
			</section>

			<section className="space-y-3">
				<h2>Your account</h2>
				<p>
					You need an account to save a profile, chat, and PDFs. The
					public Free Tools pages on /free-tools can be used without an
					account. Keep
					your sign-in details to yourself. You are responsible for
					what you upload, paste, and send in chat.
				</p>
			</section>

			<section className="space-y-3">
				<h2>Plans and payment</h2>
				<p>
					Trial is free for 7 days and does not need a card. Pro is
					$5 a month. Lifetime is $150 once. Payments are processed
					by Dodo Payments. Usage limits apply so the product stays
					usable. Refunds are handled case by case. Email{" "}
					<a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a> if
					something went wrong.
				</p>
			</section>

			<section className="space-y-3">
				<h2>Your content</h2>
				<p>
					You keep the rights to your resume, notes, and generated
					files. You give us permission to store and process them so
					the agent can write drafts. Do not upload material you do
					not have the right to use. The agent should not invent work
					history. You are responsible for what you send to an
					employer.
				</p>
			</section>

			<section className="space-y-3">
				<h2>Acceptable use</h2>
				<p>
					Do not abuse the service, try to break it, or use it to
					misrepresent someone else. We can suspend an account that
					does that.
				</p>
			</section>

			<section className="space-y-3">
				<h2>The product can change</h2>
				<p>
					Features, limits, and pricing can change. We will try to
					keep the site working, but we do not promise it will always
					be available or error-free.
				</p>
			</section>

			<section className="space-y-3">
				<h2>Contact</h2>
				<p>
					Questions:{" "}
					<a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>. Privacy
					details are in the{" "}
					<Link href="/privacy">Privacy Policy</Link>.
				</p>
			</section>
		</LegalPage>
	);
}
