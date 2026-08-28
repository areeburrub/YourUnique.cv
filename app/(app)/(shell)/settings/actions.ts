"use server";

import { auth } from "@clerk/nextjs/server";

import { updatePromotionalEmailPreference } from "@/lib/email/preferences";

export async function updatePromotionalEmailPreferenceAction(enabled: boolean) {
	const { userId } = await auth();
	if (!userId) {
		throw new Error("Unauthorized");
	}
	return updatePromotionalEmailPreference(userId, enabled);
}
