import { auth } from "@clerk/nextjs/server";

import { CHATS_PAGE_SIZE } from "@/lib/chats";
import { listProfileChatThreads } from "@/lib/profile-chat";

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
		Math.max(1, Number.parseInt(limitParam || String(CHATS_PAGE_SIZE), 10) || CHATS_PAGE_SIZE),
	);

	const result = await listProfileChatThreads(userId, { page, limit });

	return Response.json({
		threads: result.threads,
		page: result.page,
		perPage: result.perPage,
		total: result.total,
		hasMore: result.hasMore,
	});
}
