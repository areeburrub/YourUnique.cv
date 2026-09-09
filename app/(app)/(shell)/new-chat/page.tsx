import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { NewChatClient } from "./_components/new-chat-client";
import {
	getRadarJobForUser,
	getUserPlanId,
} from "@/lib/db/radar";

function buildRadarSeedPrompt(job: {
	title: string;
	company: string;
	url: string;
	location: string | null;
	workplace: string | null;
	description: string;
}) {
	const lines = [
		"Please tailor my resume for this role.",
		"",
		`Title: ${job.title}`,
		`Company: ${job.company}`,
	];
	if (job.location) {
		lines.push(`Location: ${job.location}`);
	}
	if (job.workplace) {
		lines.push(`Workplace: ${job.workplace}`);
	}
	if (job.url) {
		lines.push(`URL: ${job.url}`);
	}
	lines.push("", "Job description:", job.description.trim());
	return lines.join("\n");
}

export default async function NewChatPage({
	searchParams,
}: {
	searchParams: Promise<{
		status?: string;
		subscription_id?: string;
		payment_id?: string;
		radarJobId?: string;
	}>;
}) {
	const { userId } = await auth();
	await auth.protect();

	if (!userId) {
		redirect("/sign-in");
	}

	const params = await searchParams;
	let autoPrompt: string | undefined;

	if (params.radarJobId) {
		const planId = await getUserPlanId(userId);
		const job = await getRadarJobForUser(userId, params.radarJobId, planId);
		if (job) {
			autoPrompt = buildRadarSeedPrompt({
				title: job.title,
				company: job.company,
				url: job.url,
				location: job.location,
				workplace: job.workplace,
				description: job.description,
			});
		}
	}

	return (
		<NewChatClient
			autoPrompt={autoPrompt}
			checkoutReturn={{
				status: params.status ?? null,
				subscriptionId: params.subscription_id ?? null,
				paymentId: params.payment_id ?? null,
			}}
		/>
	);
}
