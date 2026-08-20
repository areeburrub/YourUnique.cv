import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import { listResumeVersionsForUser } from "@/lib/db/resumes";
import { toResumeListItem } from "@/lib/resumes";

import { ResumeHistory } from "./_components/resume-history";

type ResumeHistoryPageProps = {
	params: Promise<{ id: string }>;
};

export default async function ResumeHistoryPage({
	params,
}: ResumeHistoryPageProps) {
	const { userId } = await auth();
	await auth.protect();

	if (!userId) {
		redirect("/sign-in");
	}

	const { id } = await params;
	const rows = await listResumeVersionsForUser(id, userId);
	if (rows.length === 0) {
		notFound();
	}

	return (
		<ResumeHistory
			initialVersions={rows.map((row) => toResumeListItem(row, rows.length))}
		/>
	);
}
