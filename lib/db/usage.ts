import { and, eq, gte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { usageDaily, users } from "@/lib/db/schema";
import { getPlan, type PlanConfig } from "@/lib/plans";

const ROLLING_DAYS = 30;

export type PlanSummary = PlanConfig;

export type UsageSummary = {
	userId: string;
	plan: PlanSummary;
	bonusCreditsUsd: number;
	todayUsd: number;
	rolling30dUsd: number;
	monthlyLimitUsd: number;
	dailyLimitUsd: number;
};

export type UsageLimitOk = {
	blocked: false;
	summary: UsageSummary;
};

export type UsageLimitBlocked = {
	blocked: true;
	scope: "daily" | "monthly";
	resetAt?: Date;
	plan: PlanSummary;
	summary: UsageSummary;
};

export type UsageLimitResult = UsageLimitOk | UsageLimitBlocked;

function utcDateString(date = new Date()) {
	return date.toISOString().slice(0, 10);
}

function utcDateDaysAgo(days: number, from = new Date()) {
	const d = new Date(
		Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
	);
	d.setUTCDate(d.getUTCDate() - days);
	return d.toISOString().slice(0, 10);
}

function nextUtcMidnight(from = new Date()) {
	return new Date(
		Date.UTC(
			from.getUTCFullYear(),
			from.getUTCMonth(),
			from.getUTCDate() + 1,
		),
	);
}

function toNumber(value: string | number | null | undefined) {
	if (value == null) {
		return 0;
	}
	const n = typeof value === "number" ? value : Number(value);
	return Number.isFinite(n) ? n : 0;
}

export async function recordUsage(userId: string, costUsd: number) {
	if (!(costUsd > 0)) {
		return;
	}

	const today = utcDateString();
	const cost = costUsd.toFixed(4);

	await db
		.insert(usageDaily)
		.values({
			userId,
			date: today,
			costUsd: cost,
			messageCount: 1,
		})
		.onConflictDoUpdate({
			target: [usageDaily.userId, usageDaily.date],
			set: {
				costUsd: sql`${usageDaily.costUsd} + ${cost}::numeric`,
				messageCount: sql`${usageDaily.messageCount} + 1`,
			},
		});
}

export async function getUsageSummary(userId: string): Promise<UsageSummary> {
	const today = utcDateString();
	const windowStart = utcDateDaysAgo(ROLLING_DAYS - 1);

	const [userRow, todayRow, rollingRow] = await Promise.all([
		db
			.select({
				userId: users.id,
				bonusCreditsUsd: users.bonusCreditsUsd,
				planId: users.planId,
			})
			.from(users)
			.where(eq(users.id, userId))
			.limit(1),
		db
			.select({ costUsd: usageDaily.costUsd })
			.from(usageDaily)
			.where(
				and(eq(usageDaily.userId, userId), eq(usageDaily.date, today)),
			)
			.limit(1),
		db
			.select({
				total: sql<string>`coalesce(sum(${usageDaily.costUsd}), 0)`,
			})
			.from(usageDaily)
			.where(
				and(
					eq(usageDaily.userId, userId),
					gte(usageDaily.date, windowStart),
				),
			),
	]);

	const row = userRow[0];
	if (!row) {
		throw new Error(`User not found: ${userId}`);
	}

	const plan = getPlan(row.planId);
	const bonusCreditsUsd = toNumber(row.bonusCreditsUsd);

	return {
		userId,
		plan,
		bonusCreditsUsd,
		todayUsd: toNumber(todayRow[0]?.costUsd),
		rolling30dUsd: toNumber(rollingRow[0]?.total),
		monthlyLimitUsd: plan.monthlyLimitUsd + bonusCreditsUsd,
		dailyLimitUsd: plan.dailyLimitUsd,
	};
}

export async function checkUsageLimit(
	userId: string,
): Promise<UsageLimitResult> {
	const summary = await getUsageSummary(userId);

	if (summary.todayUsd >= summary.dailyLimitUsd) {
		return {
			blocked: true,
			scope: "daily",
			resetAt: nextUtcMidnight(),
			plan: summary.plan,
			summary,
		};
	}

	if (summary.rolling30dUsd >= summary.monthlyLimitUsd) {
		return {
			blocked: true,
			scope: "monthly",
			plan: summary.plan,
			summary,
		};
	}

	return { blocked: false, summary };
}
