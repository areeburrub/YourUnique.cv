import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { JobRadarClient } from "./_components/job-radar-client";
import { authPageHref, AUTH_NEXT_JOB_RADAR } from "@/lib/auth-redirect";
import { getUserContext } from "@/lib/db/contexts";

export default async function JobRadarPage() {
	const { userId } = await auth();
	await auth.protect();
	if (!userId) {
		redirect(authPageHref("/sign-in", null, AUTH_NEXT_JOB_RADAR));
	}

	const context = await getUserContext(userId);
	const hasProfile = Boolean(context?.profile && context.profile.trim().length >= 40);

	return <JobRadarClient hasProfile={hasProfile} />;
}
