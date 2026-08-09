"use server";

import {
	adjustDailyUsage,
	grantCredits,
	setAdmin,
	updateUserPlan,
} from "@/lib/db/admin";

export async function updateUserPlanAction(formData: FormData) {
	const userId = String(formData.get("userId") ?? "");
	const planId = String(formData.get("planId") ?? "");
	await updateUserPlan(userId, planId);
}

export async function setAdminAction(formData: FormData) {
	const userId = String(formData.get("userId") ?? "");
	const isAdmin = formData.get("isAdmin") === "true";
	await setAdmin(userId, isAdmin);
}

export async function grantCreditsAction(formData: FormData) {
	const userId = String(formData.get("userId") ?? "");
	const amountUsd = Number(formData.get("amountUsd"));
	const note = String(formData.get("note") ?? "");
	await grantCredits({ userId, amountUsd, note });
}

export async function adjustDailyUsageAction(formData: FormData) {
	const userId = String(formData.get("userId") ?? "");
	const date = String(formData.get("date") ?? "");
	const costUsd = Number(formData.get("costUsd"));
	await adjustDailyUsage({ userId, date, costUsd });
}
