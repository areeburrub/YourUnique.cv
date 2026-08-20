import { auth } from "@clerk/nextjs/server";

import { listResumeItemsForUser } from "@/lib/resume-list";

import { ResumesIndex } from "./_components/resumes-index";

export default async function ResumesPage() {
	const { userId } = await auth();
	const resumes = userId ? await listResumeItemsForUser(userId) : [];

	return <ResumesIndex initialResumes={resumes} />;
}
