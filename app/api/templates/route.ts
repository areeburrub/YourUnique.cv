import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { listTemplatesForUser } from "@/lib/resume-templates/registry";

export async function GET() {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const result = await listTemplatesForUser(userId);
	return NextResponse.json(result);
}
