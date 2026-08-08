import { auth } from "@clerk/nextjs/server";

import {
	deleteChatThreadForUser,
	getChatThreadForUser,
	renameChatThreadForUser,
} from "@/lib/mastra-chats";

export const runtime = "nodejs";

type RouteContext = {
	params: Promise<{ id: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await context.params;
	const thread = await getChatThreadForUser(id, userId);
	if (!thread) {
		return Response.json({ error: "Not found" }, { status: 404 });
	}

	return Response.json({
		id: thread.id,
		title: thread.title?.trim() || "New chat",
		updatedAt: thread.updatedAt.toISOString(),
	});
}

export async function PATCH(req: Request, context: RouteContext) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await context.params;
	const body = await req.json().catch(() => null);
	const title = typeof body?.title === "string" ? body.title.trim() : "";
	if (!title) {
		return Response.json({ error: "Title is required" }, { status: 400 });
	}

	const thread = await renameChatThreadForUser(id, userId, title);
	if (!thread) {
		return Response.json({ error: "Not found" }, { status: 404 });
	}

	return Response.json({
		id: thread.id,
		title: thread.title?.trim() || "New chat",
		updatedAt: thread.updatedAt.toISOString(),
	});
}

export async function DELETE(_req: Request, context: RouteContext) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await context.params;
	const deleted = await deleteChatThreadForUser(id, userId);
	if (!deleted) {
		return Response.json({ error: "Not found" }, { status: 404 });
	}

	return Response.json({ ok: true });
}
