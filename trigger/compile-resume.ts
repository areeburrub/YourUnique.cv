import { eq } from "drizzle-orm";
import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sendLifecycleEmail } from "@/trigger/email-automations";
import { compileResumePdf } from "@/trigger/lib/compile-resume-pdf";

export const compileResume = schemaTask({
	id: "compile-resume",
	schema: z.object({
		resumeId: z.string().min(1),
		userId: z.string().min(1),
	}),
	retry: {
		maxAttempts: 2,
	},
	run: async (payload) => {
		const resume = await compileResumePdf(payload);
		if (resume?.compileStatus === "ready") {
			const user = await db.query.users.findFirst({
				where: eq(users.id, payload.userId),
				columns: { email: true },
			});
			if (user?.email) {
				await sendLifecycleEmail.trigger(
					{
						alias: "yucv-pdf-ready",
						to: user.email,
						userId: payload.userId,
						dripCycle: payload.resumeId,
						variables: {
							COMPANY: resume.companyName ?? "your",
							ROLE: resume.roleTitle ?? "this role",
						},
						ctaPath: "/resumes",
					},
					{ delay: "15m" },
				);
			}
		}
		return {
			resumeId: payload.resumeId,
			compileStatus: resume?.compileStatus ?? "ready",
			pdfFileId: resume?.pdfFileId ?? null,
		};
	},
});
