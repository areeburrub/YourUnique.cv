import { db } from "@/lib/db";
import { freeToolLeads } from "@/lib/db/schema";

export async function recordFreeToolLead(input: {
	id: string;
	tool: string;
	leadName: string | null;
	leadEmail: string | null;
	resumeFileKey: string | null;
	resumeFilename: string | null;
	jobText: string | null;
	resultJson: Record<string, unknown>;
	costUsd: number;
	ip: string | null;
}) {
	await db.insert(freeToolLeads).values({
		id: input.id,
		tool: input.tool,
		leadName: input.leadName,
		leadEmail: input.leadEmail,
		resumeFileKey: input.resumeFileKey,
		resumeFilename: input.resumeFilename,
		jobText: input.jobText,
		resultJson: input.resultJson,
		costUsd: input.costUsd.toFixed(6),
		ip: input.ip,
	});
}
