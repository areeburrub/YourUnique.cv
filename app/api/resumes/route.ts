import { auth } from "@clerk/nextjs/server";

import { listResumesForUser } from "@/lib/db/resumes";
import { toResumeListItem } from "@/lib/resumes";

export const runtime = "nodejs";

export async function GET() {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const rows = await listResumesForUser(userId);
	return Response.json({
		resumes: rows.map(toResumeListItem),
	});
}
