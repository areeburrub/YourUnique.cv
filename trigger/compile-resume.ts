import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

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
		return {
			resumeId: payload.resumeId,
			compileStatus: resume?.compileStatus ?? "ready",
			pdfFileId: resume?.pdfFileId ?? null,
		};
	},
});
