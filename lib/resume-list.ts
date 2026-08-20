import { listLatestResumesForUser } from "@/lib/db/resumes";
import { toResumeListItem } from "@/lib/resumes";

export async function listResumeItemsForUser(userId: string) {
	const { latest, versionCountByFamily } = await listLatestResumesForUser(userId);
	return latest.map((row) =>
		toResumeListItem(row, versionCountByFamily.get(row.familyId) ?? 1),
	);
}
