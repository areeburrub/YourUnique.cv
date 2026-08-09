import { auth } from "@clerk/nextjs/server";

import { listResumesForUser } from "@/lib/db/resumes";
import { toResumeListItem } from "@/lib/resumes";

import { ResumesIndex } from "./_components/resumes-index";

export default async function ResumesPage() {
	const { userId } = await auth();
	const rows = userId ? await listResumesForUser(userId) : [];

	return <ResumesIndex initialResumes={rows.map(toResumeListItem)} />;
}
