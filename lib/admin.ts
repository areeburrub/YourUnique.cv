import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function getAdminUser() {
	const { userId } = await auth();
	if (!userId) {
		return null;
	}

	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
	});

	if (!user?.isAdmin) {
		return null;
	}

	return user;
}

export async function requireAdmin() {
	const { userId } = await auth();
	if (!userId) {
		redirect("/sign-in");
	}

	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
	});

	if (!user?.isAdmin) {
		notFound();
	}

	return user;
}
