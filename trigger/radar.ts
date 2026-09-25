import { schedules, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

import { listPaidUsersForDailyRadar } from "@/lib/db/radar";
import { ensureDailyRadarSearch, startPaidRadarMatch } from "@/lib/radar-start";
import {
	triggerRadarBSMRefresh,
	triggerRadarGalleryRefresh,
	triggerRadarIngest,
	triggerRadarJobpinRefresh,
	triggerRadarStartupMapRefresh,
} from "@/lib/radar-client";

export const radarMatchUser = schemaTask({
	id: "radar-match-user",
	schema: z.object({
		userId: z.string().min(1),
		kind: z.enum(["onboarding", "daily"]).default("daily"),
	}),
	queue: {
		concurrencyLimit: 2,
	},
	retry: {
		maxAttempts: 2,
	},
	run: async (payload) => {
		return startPaidRadarMatch(payload.userId, payload.kind);
	},
});

/**
 * Daily sweep for Pro users. Same `ensureDailyRadarSearch` as the jobs-list
 * page load, Enable Radar, and the post-upgrade webhook. This task is the
 * scheduled caller; `radar-match-user` is only for a manual/ops run from
 * the Trigger.dev dashboard.
 */
export const radarDailyPro = schedules.task({
	id: "radar-daily-pro",
	cron: {
		pattern: "0 8 * * *",
		// Trigger's schedule allowlist uses the older IANA name; same offset as IST.
		timezone: "Asia/Calcutta",
	},
	run: async () => {
		const users = await listPaidUsersForDailyRadar();
		let triggered = 0;
		for (const user of users) {
			const result = await ensureDailyRadarSearch(user.userId);
			if (result.triggered) {
				await result.kickoff();
				triggered++;
			}
		}
		return { users: users.length, triggered };
	},
});

export const radarGallery = schedules.task({
	id: "radar-gallery",
	cron: {
		pattern: "0 4 * * *",
		timezone: "UTC",
	},
	run: async () => {
		return triggerRadarGalleryRefresh();
	},
});

export const radarBsm = schedules.task({
	id: "radar-bsm",
	cron: {
		pattern: "15 4 * * *",
		timezone: "UTC",
	},
	run: async () => {
		return triggerRadarBSMRefresh();
	},
});

export const radarJobpin = schedules.task({
	id: "radar-jobpin",
	cron: {
		pattern: "20 4 * * *",
		timezone: "UTC",
	},
	run: async () => {
		return triggerRadarJobpinRefresh();
	},
});

export const radarStartupMap = schedules.task({
	id: "radar-startupmap",
	cron: {
		pattern: "25 4 * * *",
		timezone: "UTC",
	},
	run: async () => {
		return triggerRadarStartupMapRefresh();
	},
});

export const radarIngest = schedules.task({
	id: "radar-ingest",
	cron: {
		pattern: "0 5 * * *",
		timezone: "UTC",
	},
	run: async () => {
		await triggerRadarIngest();
		return { ok: true };
	},
});
