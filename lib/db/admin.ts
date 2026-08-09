"use server";

import { and, desc, eq, gte, ilike, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { creditGrants, usageDaily, users } from "@/lib/db/schema";
import { getPlan, isPlanId } from "@/lib/plans";

function utcDateDaysAgo(days: number) {
	const now = new Date();
	const d = new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
	);
	d.setUTCDate(d.getUTCDate() - days);
	return d.toISOString().slice(0, 10);
}

function utcToday() {
	return new Date().toISOString().slice(0, 10);
}

function toUsdString(value: number | string) {
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n)) {
		throw new Error("Invalid USD amount");
	}
	return n.toFixed(4);
}

export async function listAdminUsers(query?: string) {
	await requireAdmin();
	const today = utcToday();
	const windowStart = utcDateDaysAgo(29);

	const base = db
		.select({
			id: users.id,
			email: users.email,
			firstName: users.firstName,
			lastName: users.lastName,
			planId: users.planId,
			isAdmin: users.isAdmin,
			bonusCreditsUsd: users.bonusCreditsUsd,
			createdAt: users.createdAt,
			todayUsd: sql<string>`coalesce((
				select ${usageDaily.costUsd}
				from ${usageDaily}
				where ${usageDaily.userId} = ${users.id}
					and ${usageDaily.date} = ${today}
			), 0)`,
			rolling30dUsd: sql<string>`coalesce((
				select sum(${usageDaily.costUsd})
				from ${usageDaily}
				where ${usageDaily.userId} = ${users.id}
					and ${usageDaily.date} >= ${windowStart}
			), 0)`,
		})
		.from(users);

	const filtered = query?.trim()
		? base.where(ilike(users.email, `%${query.trim()}%`))
		: base;

	const rows = await filtered.orderBy(desc(users.createdAt)).limit(200);

	return rows.map((row) => ({
		...row,
		planName: getPlan(row.planId).name,
	}));
}

export async function getAdminUserDetail(userId: string) {
	await requireAdmin();
	const windowStart = utcDateDaysAgo(29);

	const [user] = await db
		.select({
			id: users.id,
			email: users.email,
			firstName: users.firstName,
			lastName: users.lastName,
			imageUrl: users.imageUrl,
			planId: users.planId,
			isAdmin: users.isAdmin,
			bonusCreditsUsd: users.bonusCreditsUsd,
			createdAt: users.createdAt,
			updatedAt: users.updatedAt,
		})
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	if (!user) {
		return null;
	}

	const [usageRows, grantRows] = await Promise.all([
		db
			.select()
			.from(usageDaily)
			.where(
				and(
					eq(usageDaily.userId, userId),
					gte(usageDaily.date, windowStart),
				),
			)
			.orderBy(desc(usageDaily.date)),
		db
			.select()
			.from(creditGrants)
			.where(eq(creditGrants.userId, userId))
			.orderBy(desc(creditGrants.createdAt))
			.limit(50),
	]);

	return {
		user: {
			...user,
			planName: getPlan(user.planId).name,
		},
		usageRows,
		grantRows,
	};
}

export async function updateUserPlan(userId: string, planId: string) {
	await requireAdmin();
	if (!isPlanId(planId)) {
		throw new Error("Invalid plan");
	}
	await db
		.update(users)
		.set({ planId, updatedAt: new Date() })
		.where(eq(users.id, userId));
	revalidatePath("/admin/users");
	revalidatePath(`/admin/users/${userId}`);
}

export async function setAdmin(userId: string, isAdmin: boolean) {
	const admin = await requireAdmin();
	if (admin.id === userId && !isAdmin) {
		throw new Error("You cannot remove your own admin access");
	}
	await db
		.update(users)
		.set({ isAdmin, updatedAt: new Date() })
		.where(eq(users.id, userId));
	revalidatePath("/admin/users");
	revalidatePath(`/admin/users/${userId}`);
}

export async function grantCredits(input: {
	userId: string;
	amountUsd: number;
	note?: string;
}) {
	const admin = await requireAdmin();
	const amount = toUsdString(input.amountUsd);

	await db.transaction(async (tx) => {
		await tx
			.update(users)
			.set({
				bonusCreditsUsd: sql`${users.bonusCreditsUsd} + ${amount}::numeric`,
				updatedAt: new Date(),
			})
			.where(eq(users.id, input.userId));

		await tx.insert(creditGrants).values({
			id: nanoid(),
			userId: input.userId,
			amountUsd: amount,
			note: input.note?.trim() || null,
			grantedBy: admin.id,
		});
	});

	revalidatePath("/admin/users");
	revalidatePath(`/admin/users/${input.userId}`);
}

export async function adjustDailyUsage(input: {
	userId: string;
	date: string;
	costUsd: number;
}) {
	await requireAdmin();
	const cost = toUsdString(input.costUsd);

	await db
		.insert(usageDaily)
		.values({
			userId: input.userId,
			date: input.date,
			costUsd: cost,
			messageCount: 0,
		})
		.onConflictDoUpdate({
			target: [usageDaily.userId, usageDaily.date],
			set: { costUsd: cost },
		});

	revalidatePath(`/admin/users/${input.userId}`);
}
