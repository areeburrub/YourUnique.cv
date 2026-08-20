import { auth } from "@clerk/nextjs/server";

import { listResumeItemsForUser } from "@/lib/resume-list";

export const runtime = "nodejs";

export async function GET() {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const resumes = await listResumeItemsForUser(userId);
	return Response.json({
		resumes,
	});
}
