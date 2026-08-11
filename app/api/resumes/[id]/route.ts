import { auth } from "@clerk/nextjs/server";

import { getResumeDocument, getResumeForUser } from "@/lib/db/resumes";
import { toResumeListItem } from "@/lib/resumes";

export const runtime = "nodejs";

type ResumeRouteProps = {
	params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: ResumeRouteProps) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await params;
	const row = await getResumeForUser(id, userId);
	if (!row) {
		return Response.json({ error: "Resume not found" }, { status: 404 });
	}

	return Response.json({
		resume: {
			...toResumeListItem(row),
			document: getResumeDocument(row),
			jobDescription: row.jobDescription,
		},
	});
}
