import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage } from "@/components/landing/legal-page";
import { applyEmailUnsubscribe } from "@/lib/email/preferences";
import { parseUnsubscribeToken } from "@/lib/email/tokens";
import { SITE_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
	title: "Unsubscribe",
	robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
	searchParams,
}: {
	searchParams: Promise<{ token?: string }>;
}) {
	const { token } = await searchParams;
	const payload = token ? parseUnsubscribeToken(token) : null;

	if (payload) {
		await applyEmailUnsubscribe(payload);
	}

	return (
		<LegalPage
			eyebrow="Email"
			title={payload ? "You're unsubscribed" : "Link didn't work"}
			updated="August 28, 2026"
		>
			{payload ? (
				<section className="space-y-3">
					<p>
						We turned off product updates for {payload.email}.
						Important notices still go out.
					</p>
					<p>
						Signed in? Manage this on the{" "}
						<Link href="/settings">settings</Link> page. Questions:{" "}
						<a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>.
					</p>
				</section>
			) : (
				<section className="space-y-3">
					<p>
						That unsubscribe link is missing or invalid. Open{" "}
						<Link href="/settings">{SITE_NAME} settings</Link> while
						signed in, or write {SITE_EMAIL}.
					</p>
				</section>
			)}
		</LegalPage>
	);
}
