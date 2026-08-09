import { createTool } from "@mastra/core/tools";
import { runs, tasks } from "@trigger.dev/sdk";
import { z } from "zod";

import {
	appendResumeSource,
	createResume,
	getResumeForUser,
	listResumesForUser,
	patchResumeSource,
	updateResumeForUser,
} from "@/lib/db/resumes";
import {
	readResumeSkillNotes,
	readResumeTemplateNotes,
} from "@/lib/resume-compile";
import type { compileResume } from "@/trigger/compile-resume";

function requireUserId(
	requestContext: { get: (key: string) => unknown } | undefined,
) {
	const userId = requestContext?.get("userId");
	if (typeof userId !== "string" || !userId) {
		throw new Error("Unauthorized");
	}
	return userId;
}

function appBaseUrl() {
	if (process.env.NEXT_PUBLIC_APP_URL) {
		return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
	}
	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
	}
	return "http://localhost:6700";
}

function resumePreviewUrl(resumeId: string) {
	return `${appBaseUrl()}/api/resumes/${resumeId}/download`;
}

function resumeDownloadUrl(resumeId: string) {
	return `${appBaseUrl()}/api/resumes/${resumeId}/download?download=1`;
}

const patchSchema = z.object({
	old_string: z
		.string()
		.min(1)
		.describe(
			"Exact text to find in the current sourceTex. Include enough surrounding context to make it unique.",
		),
	new_string: z
		.string()
		.describe("Replacement text. Use an empty string to delete the matched text."),
});

function toResumeSummary(row: {
	id: string;
	name: string;
	compileStatus: string;
	compiledAt: Date | null;
	updatedAt: Date;
	pdfFileId: string | null;
}) {
	return {
		id: row.id,
		name: row.name,
		compileStatus: row.compileStatus,
		compiledAt: row.compiledAt?.toISOString() ?? null,
		updatedAt: row.updatedAt.toISOString(),
		hasPdf: Boolean(row.pdfFileId),
	};
}

export const listResumesTool = createTool({
	id: "list_resumes",
	description: "List the user's saved resume generations (id, name, compile status).",
	inputSchema: z.object({}),
	outputSchema: z.object({
		resumes: z.array(
			z.object({
				id: z.string(),
				name: z.string(),
				compileStatus: z.string(),
				compiledAt: z.string().nullable(),
				updatedAt: z.string(),
				hasPdf: z.boolean(),
			}),
		),
	}),
	execute: async (_input, context) => {
		const userId = requireUserId(context?.requestContext);
		const rows = await listResumesForUser(userId);
		return {
			resumes: rows.map(toResumeSummary),
		};
	},
});

export const getResumeTool = createTool({
	id: "get_resume",
	description:
		"Get a resume generation including sourceTex LaTeX content and compile status.",
	inputSchema: z.object({
		id: z.string().min(1).describe("Resume id"),
	}),
	outputSchema: z.object({
		id: z.string(),
		name: z.string(),
		sourceTex: z.string(),
		jobDescription: z.string().nullable(),
		compileStatus: z.string(),
		compileError: z.string().nullable(),
		compiledAt: z.string().nullable(),
		updatedAt: z.string(),
		hasPdf: z.boolean(),
	}),
	execute: async (input, context) => {
		const userId = requireUserId(context?.requestContext);
		const row = await getResumeForUser(input.id, userId);
		if (!row) {
			throw new Error("Resume not found");
		}
		return {
			id: row.id,
			name: row.name,
			sourceTex: row.sourceTex,
			jobDescription: row.jobDescription,
			compileStatus: row.compileStatus,
			compileError: row.compileError,
			compiledAt: row.compiledAt?.toISOString() ?? null,
			updatedAt: row.updatedAt.toISOString(),
			hasPdf: Boolean(row.pdfFileId),
		};
	},
});

export const getResumeTemplateNotesTool = createTool({
	id: "get_resume_template_notes",
	description:
		"Read the LaTeX resume template allowlist, skeleton, and editing rules (same as portfolio MCP documents://resume-template-notes). Call this before creating or heavily editing sourceTex.",
	inputSchema: z.object({}),
	outputSchema: z.object({
		notes: z.string(),
	}),
	execute: async () => {
		const notes = await readResumeTemplateNotes();
		return { notes };
	},
});

export const getResumeBuilderNotesTool = createTool({
	id: "get_resume_builder_notes",
	description:
		"Read job-tailoring / ATS resume-builder skill instructions (same as portfolio MCP skills://resume-builder). Call when the user provided a job description or asked to tailor a resume for a role.",
	inputSchema: z.object({}),
	outputSchema: z.object({
		notes: z.string(),
	}),
	execute: async () => {
		const notes = await readResumeSkillNotes("resume-builder");
		return { notes };
	},
});

export const getHumanizerNotesTool = createTool({
	id: "get_humanizer_notes",
	description:
		"Read humanizer skill instructions for removing AI writing patterns (same as portfolio MCP skills://humanizer). Call after drafting sourceTex and rewrite Summary + bullet prose before create/patch finalize.",
	inputSchema: z.object({}),
	outputSchema: z.object({
		notes: z.string(),
	}),
	execute: async () => {
		const notes = await readResumeSkillNotes("humanizer");
		return { notes };
	},
});

export const createResumeTool = createTool({
	id: "create_resume",
	description:
		"Create a new resume generation. Body goes in sourceTex (resume.tex LaTeX using only allowlisted macros from main.tex).",
	inputSchema: z.object({
		name: z.string().min(1).max(200).describe("Display name for this resume"),
		sourceTex: z
			.string()
			.min(1)
			.describe("LaTeX resume.tex content using allowlisted macros only"),
		jobDescription: z
			.string()
			.optional()
			.describe("Optional job description this resume was tailored for"),
	}),
	outputSchema: z.object({
		id: z.string(),
		name: z.string(),
		compileStatus: z.string(),
		updatedAt: z.string(),
	}),
	execute: async (input, context) => {
		const userId = requireUserId(context?.requestContext);
		const row = await createResume({
			userId,
			name: input.name,
			sourceTex: input.sourceTex,
			jobDescription: input.jobDescription,
		});
		return {
			id: row.id,
			name: row.name,
			compileStatus: row.compileStatus,
			updatedAt: row.updatedAt.toISOString(),
		};
	},
});

export const appendToResumeTool = createTool({
	id: "append_to_resume",
	description:
		"Append a LaTeX snippet to sourceTex. Prefer this for adding sections/bullets. Do not send the full document — only the new text.",
	inputSchema: z.object({
		id: z.string().min(1),
		text: z.string().min(1),
		ensureLeadingNewline: z.boolean().optional(),
	}),
	outputSchema: z.object({
		ok: z.boolean(),
		id: z.string(),
		updatedAt: z.string().nullable(),
	}),
	execute: async (input, context) => {
		const userId = requireUserId(context?.requestContext);
		const row = await appendResumeSource(
			input.id,
			userId,
			input.text,
			input.ensureLeadingNewline ?? true,
		);
		if (!row) {
			throw new Error("Resume not found");
		}
		return {
			ok: true,
			id: row.id,
			updatedAt: row.updatedAt.toISOString(),
		};
	},
});

export const patchResumeTool = createTool({
	id: "patch_resume",
	description:
		"Apply one or more exact search/replace patches to sourceTex. Prefer small unique edits over rewriting the whole document. Patches are applied in order.",
	inputSchema: z.object({
		id: z.string().min(1),
		patches: z
			.array(patchSchema)
			.min(1)
			.describe("Ordered list of exact string replacements to apply"),
	}),
	outputSchema: z.object({
		ok: z.boolean(),
		applied: z.number(),
		updatedAt: z.string().nullable(),
	}),
	execute: async (input, context) => {
		const userId = requireUserId(context?.requestContext);
		const row = await patchResumeSource(input.id, userId, input.patches);
		if (!row) {
			throw new Error("Resume not found");
		}
		return {
			ok: true,
			applied: input.patches.length,
			updatedAt: row.updatedAt.toISOString(),
		};
	},
});

export const renameResumeTool = createTool({
	id: "rename_resume",
	description: "Rename a resume generation",
	inputSchema: z.object({
		id: z.string().min(1),
		name: z.string().min(1).max(200),
	}),
	outputSchema: z.object({
		ok: z.boolean(),
		id: z.string(),
		name: z.string(),
	}),
	execute: async (input, context) => {
		const userId = requireUserId(context?.requestContext);
		const row = await updateResumeForUser(input.id, userId, {
			name: input.name,
		});
		if (!row) {
			throw new Error("Resume not found");
		}
		return {
			ok: true,
			id: row.id,
			name: row.name,
		};
	},
});

export const compileResumeTool = createTool({
	id: "compile_resume",
	description:
		"Compile a resume to PDF via Tectonic (LaTeX) and wait until it finishes. Returns previewUrl and downloadUrl when ready. The chat UI shows the PDF from this result — call this after create/patch and share the links with the user.",
	inputSchema: z.object({
		id: z.string().min(1),
	}),
	outputSchema: z.object({
		ok: z.boolean(),
		id: z.string(),
		name: z.string(),
		compileStatus: z.string(),
		runId: z.string(),
		previewUrl: z.string(),
		downloadUrl: z.string(),
		resumesPath: z.string(),
		instruction: z.string(),
	}),
	execute: async (input, context) => {
		const userId = requireUserId(context?.requestContext);
		const existing = await getResumeForUser(input.id, userId);
		if (!existing) {
			throw new Error("Resume not found");
		}

		const updated = await updateResumeForUser(input.id, userId, {
			compileStatus: "queued",
			compileError: null,
		});
		if (!updated) {
			throw new Error("Resume not found");
		}

		let runId = "";
		try {
			const handle = await tasks.trigger<typeof compileResume>(
				"compile-resume",
				{
					resumeId: input.id,
					userId,
				},
			);
			runId = handle.id;

			const run = await runs.poll<typeof compileResume>(handle.id, {
				pollIntervalMs: 750,
			});

			if (!run.isSuccess) {
				const detail =
					run.error?.message?.slice(0, 800) ??
					`Compile run ended with status ${run.status}`;
				throw new Error(detail);
			}
		} catch (error) {
			const message =
				error instanceof Error
					? error.message.slice(0, 800)
					: "Failed to compile resume";
			const row = await getResumeForUser(input.id, userId);
			if (row?.compileStatus !== "failed") {
				await updateResumeForUser(input.id, userId, {
					compileStatus: "failed",
					compileError: message,
				});
			}
			throw new Error(
				`PDF compile failed. Ensure TRIGGER_SECRET_KEY is set and trigger.dev is running. (${message})`,
			);
		}

		const ready = await getResumeForUser(input.id, userId);
		if (!ready || ready.compileStatus !== "ready" || !ready.pdfFileId) {
			throw new Error(
				`Compile finished but resume is not ready (status: ${ready?.compileStatus ?? "missing"}).`,
			);
		}

		return {
			ok: true,
			id: ready.id,
			name: ready.name,
			compileStatus: ready.compileStatus,
			runId,
			previewUrl: resumePreviewUrl(ready.id),
			downloadUrl: resumeDownloadUrl(ready.id),
			resumesPath: "/resumes",
			instruction:
				"The PDF is ready and shown in chat. Share the downloadUrl with the user. Do not fetch the PDF yourself.",
		};
	},
});

export const getResumeDownloadTool = createTool({
	id: "get_resume_download",
	description:
		"Get preview/download URLs for an already-compiled resume. Prefer compile_resume when you just finished drafting — it waits and returns these URLs.",
	inputSchema: z.object({
		id: z.string().min(1),
	}),
	outputSchema: z.object({
		previewUrl: z.string(),
		downloadUrl: z.string(),
		resumesPath: z.string(),
		compileStatus: z.string(),
		name: z.string(),
		instruction: z.string(),
	}),
	execute: async (input, context) => {
		const userId = requireUserId(context?.requestContext);
		const row = await getResumeForUser(input.id, userId);
		if (!row) {
			throw new Error("Resume not found");
		}
		if (row.compileStatus !== "ready" || !row.pdfFileId) {
			throw new Error(
				`Resume PDF is not ready (status: ${row.compileStatus}). Call compile_resume first.`,
			);
		}

		return {
			previewUrl: resumePreviewUrl(row.id),
			downloadUrl: resumeDownloadUrl(row.id),
			resumesPath: "/resumes",
			compileStatus: row.compileStatus,
			name: row.name,
			instruction:
				"Give the user this downloadUrl. Do not download or fetch the PDF yourself.",
		};
	},
});
