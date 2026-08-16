import { tasks } from "@trigger.dev/sdk";

import { updateResumeForUser } from "@/lib/db/resumes";
import type { compileResume } from "@/trigger/compile-resume";

export async function queueResumeCompile(input: {
	resumeId: string;
	userId: string;
}) {
	const updated = await updateResumeForUser(input.resumeId, input.userId, {
		compileStatus: "queued",
		compileError: null,
	});
	if (!updated) {
		throw new Error("Resume not found");
	}

	try {
		const handle = await tasks.trigger<typeof compileResume>(
			"compile-resume",
			{
				resumeId: input.resumeId,
				userId: input.userId,
			},
		);
		return {
			runId: handle.id,
			resume: updated,
		};
	} catch (error) {
		const message =
			error instanceof Error
				? error.message.slice(0, 800)
				: "Failed to queue PDF compile";
		await updateResumeForUser(input.resumeId, input.userId, {
			compileStatus: "failed",
			compileError: message,
		});
		throw new Error(
			`PDF compile failed to start. Ensure TRIGGER_SECRET_KEY is set and trigger.dev is running. (${message})`,
		);
	}
}
