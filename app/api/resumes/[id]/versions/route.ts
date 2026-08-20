import { auth } from "@clerk/nextjs/server";

import { listResumeVersionsForUser } from "@/lib/db/resumes";
import { toResumeListItem } from "@/lib/resumes";

export const runtime = "nodejs";

type ResumeVersionsRouteProps = {
	params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: ResumeVersionsRouteProps) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await params;
	const rows = await listResumeVersionsForUser(id, userId);
	if (rows.length === 0) {
		return Response.json({ error: "Resume not found" }, { status: 404 });
	}

	return Response.json({
		versions: rows.map((row) => toResumeListItem(row, rows.length)),
	});
}
