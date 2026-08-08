import { auth } from "@clerk/nextjs/server";

import { listChatThreads } from "@/lib/mastra-chats";

export const runtime = "nodejs";

export async function GET(req: Request) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const url = new URL(req.url);
	const pageParam = url.searchParams.get("page");
	const limitParam = url.searchParams.get("limit");
	const page = Math.max(0, Number.parseInt(pageParam || "0", 10) || 0);
	const limit = Math.min(
		50,
		Math.max(1, Number.parseInt(limitParam || "20", 10) || 20),
	);

	const result = await listChatThreads(userId, { page, limit });

	return Response.json({
		threads: result.threads,
		page: result.page,
		perPage: result.perPage,
		total: result.total,
		hasMore: result.hasMore,
	});
}
