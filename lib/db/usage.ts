import { and, eq, gte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { expirePaidAccessIfNeeded } from "@/lib/db/trials";
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
	trialEndsAt: Date | null;
	proExpiresAt: Date | null;
	canStartTrial: boolean;
	isTrialActive: boolean;
	monthlyResetAt: Date | null;
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
				trialEndsAt: users.trialEndsAt,
				proExpiresAt: users.proExpiresAt,
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
				oldestDate: sql<string | null>`min(${usageDaily.date})`,
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

	const resolved = await expirePaidAccessIfNeeded({
		id: row.userId,
		planId: row.planId,
		trialEndsAt: row.trialEndsAt,
		proExpiresAt: row.proExpiresAt,
	});
	const plan = getPlan(resolved.planId);
	const bonusCreditsUsd = toNumber(row.bonusCreditsUsd);

	return {
		userId,
		plan,
		bonusCreditsUsd,
		todayUsd: toNumber(todayRow[0]?.costUsd),
		rolling30dUsd: toNumber(rollingRow[0]?.total),
		monthlyLimitUsd: plan.monthlyLimitUsd + bonusCreditsUsd,
		dailyLimitUsd: plan.dailyLimitUsd,
		trialEndsAt: resolved.trialEndsAt,
		proExpiresAt: resolved.proExpiresAt ?? null,
		canStartTrial: false,
		isTrialActive: false,
		monthlyResetAt: monthlyResetFromOldest(rollingRow[0]?.oldestDate),
	};
}

function monthlyResetFromOldest(oldestDate: string | null | undefined) {
	if (!oldestDate) {
		return null;
	}
	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(oldestDate);
	if (!match) {
		return null;
	}
	return new Date(
		Date.UTC(
			Number(match[1]),
			Number(match[2]) - 1,
			Number(match[3]) + ROLLING_DAYS,
		),
	);
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
