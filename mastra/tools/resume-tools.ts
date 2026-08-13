import { createTool } from "@mastra/core/tools";
import { runs, tasks } from "@trigger.dev/sdk";
import { z } from "zod";

import { getUserContext } from "@/lib/db/contexts";
import {
	createResume,
	getResumeDocument,
	getResumeForUser,
	listResumesForUser,
	replaceResumeDocument,
	updateResumeForUser,
} from "@/lib/db/resumes";
import { extractLinkedInJobId } from "@/lib/linkedin-jobs";
import { readResumeSkillNotes } from "@/lib/resume-compile";
import {
	resolveTemplate,
	resolveUserSelectedTemplate,
} from "@/lib/resume-templates/registry";
import { normalizeTemplateRef } from "@/lib/resume-templates/refs";
import type { compileResume } from "@/trigger/compile-resume";
import type { fetchLinkedInJob } from "@/trigger/fetch-linkedin-job";

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
	const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
	if (explicit) {
		return explicit;
	}

	const host =
		process.env.VERCEL_PROJECT_PRODUCTION_URL ||
		process.env.VERCEL_URL ||
		null;
	if (host) {
		return `https://${host.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
	}

	return "http://localhost:6700";
}

function resumePreviewUrl(resumeId: string) {
	return `${appBaseUrl()}/api/resumes/${resumeId}/download`;
}

function resumeDownloadUrl(resumeId: string) {
	return `${appBaseUrl()}/api/resumes/${resumeId}/download?download=1`;
}

function toResumeSummary(row: {
	id: string;
	name: string;
	companyName: string | null;
	roleTitle: string | null;
	jobLink: string | null;
	compileStatus: string;
	compiledAt: Date | null;
	updatedAt: Date;
	pdfFileId: string | null;
}) {
	return {
		id: row.id,
		name: row.name,
		companyName: row.companyName,
		roleTitle: row.roleTitle,
		jobLink: row.jobLink,
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
				companyName: z.string().nullable(),
				roleTitle: z.string().nullable(),
				jobLink: z.string().nullable(),
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
		"Get a resume generation including its structured document JSON, template ref, and compile status.",
	inputSchema: z.object({
		id: z.string().min(1).describe("Resume id"),
	}),
	outputSchema: z.object({
		id: z.string(),
		name: z.string(),
		templateRef: z.string(),
		document: z.record(z.string(), z.unknown()),
		jobDescription: z.string().nullable(),
		companyName: z.string().nullable(),
		roleTitle: z.string().nullable(),
		jobLink: z.string().nullable(),
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
			templateRef: normalizeTemplateRef(row.templateRef),
			document: getResumeDocument(row),
			jobDescription: row.jobDescription,
			companyName: row.companyName,
			roleTitle: row.roleTitle,
			jobLink: row.jobLink,
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
		"Read the selected resume template's notes and JSON Schema. Call before create_resume / update_resume_document. The document must match inputSchema for this template — schemas differ per template.",
	inputSchema: z.object({
		resumeId: z
			.string()
			.optional()
			.describe(
				"When editing an existing resume, pass its id so notes/schema match the resume snapshot even if the user changed their default template.",
			),
	}),
	outputSchema: z.object({
		templateRef: z.string(),
		name: z.string(),
		notes: z.string(),
		inputSchema: z.record(z.string(), z.unknown()),
	}),
	execute: async (input, context) => {
		const userId = requireUserId(context?.requestContext);
		let template;
		if (input.resumeId) {
			const resume = await getResumeForUser(input.resumeId, userId);
			if (!resume) {
				throw new Error("Resume not found");
			}
			template = await resolveTemplate(
				normalizeTemplateRef(resume.templateRef),
				userId,
			);
		} else {
			template = await resolveUserSelectedTemplate(userId);
		}
		return {
			templateRef: template.ref,
			name: template.name,
			notes: template.notes,
			inputSchema: template.inputSchema,
		};
	},
});

export const getResumeBuilderNotesTool = createTool({
	id: "get_resume_builder_notes",
	description:
		"Read job-tailoring / ATS resume-builder skill instructions. Call when the user provided a job description or asked to tailor a resume for a role.",
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
		"Read humanizer skill instructions for removing AI writing patterns. Call after drafting document prose and rewrite Summary + bullets before create/update finalize.",
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
		"Create a new resume from structured document JSON matching the selected template's inputSchema. Never send markup. When tailored to a job, always pass companyName, roleTitle, and jobLink when known.",
	inputSchema: z.object({
		name: z
			.string()
			.min(1)
			.max(200)
			.describe(
				"Display name for this resume, preferably like 'Role @ Company' when tailored",
			),
		document: z
			.record(z.string(), z.unknown())
			.describe(
				"Structured resume JSON matching the inputSchema from get_resume_template_notes",
			),
		jobDescription: z
			.string()
			.optional()
			.describe("Optional job description this resume was tailored for"),
		companyName: z
			.string()
			.max(200)
			.optional()
			.describe("Target company name from the JD when known"),
		roleTitle: z
			.string()
			.max(200)
			.optional()
			.describe("Target role / job title from the JD when known"),
		jobLink: z
			.string()
			.max(2000)
			.optional()
			.describe("Job posting URL if the user provided one"),
	}),
	outputSchema: z.object({
		id: z.string(),
		name: z.string(),
		companyName: z.string().nullable(),
		roleTitle: z.string().nullable(),
		jobLink: z.string().nullable(),
		templateRef: z.string(),
		compileStatus: z.string(),
		updatedAt: z.string(),
	}),
	execute: async (input, context) => {
		const userId = requireUserId(context?.requestContext);
		const contextRow = await getUserContext(userId);
		const templateRef = normalizeTemplateRef(contextRow?.templateRef);
		const template = await resolveTemplate(templateRef, userId);
		const document = template.validate(input.document);
		const row = await createResume({
			userId,
			name: input.name,
			document,
			templateRef: template.ref,
			jobDescription: input.jobDescription,
			companyName: input.companyName,
			roleTitle: input.roleTitle,
			jobLink: input.jobLink,
		});
		return {
			id: row.id,
			name: row.name,
			companyName: row.companyName,
			roleTitle: row.roleTitle,
			jobLink: row.jobLink,
			templateRef: row.templateRef,
			compileStatus: row.compileStatus,
			updatedAt: row.updatedAt.toISOString(),
		};
	},
});

export const updateResumeDocumentTool = createTool({
	id: "update_resume_document",
	description:
		"Replace the structured resume JSON for an existing generation. Document must match that resume's template inputSchema. Send the full updated document — never markup.",
	inputSchema: z.object({
		id: z.string().min(1),
		document: z.record(z.string(), z.unknown()),
	}),
	outputSchema: z.object({
		ok: z.boolean(),
		id: z.string(),
		updatedAt: z.string().nullable(),
	}),
	execute: async (input, context) => {
		const userId = requireUserId(context?.requestContext);
		const existing = await getResumeForUser(input.id, userId);
		if (!existing) {
			throw new Error("Resume not found");
		}
		const template = await resolveTemplate(
			normalizeTemplateRef(existing.templateRef),
			userId,
		);
		const document = template.validate(input.document);
		const row = await replaceResumeDocument(input.id, userId, document);
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
		"Compile a resume document to PDF via the selected HTML template and wait until it finishes. Returns previewUrl and downloadUrl when ready. Call after create/update and share the links with the user.",
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

export const fetchLinkedInJobTool = createTool({
	id: "fetch_linkedin_job",
	description:
		"Fetch a LinkedIn job posting from a jobs URL (view or search-results with currentJobId). Call when the user pasted a LinkedIn job link but not the full job description text. Returns title, company, location, description, and criteria for tailoring.",
	inputSchema: z.object({
		url: z
			.string()
			.min(1)
			.describe(
				"LinkedIn job URL, e.g. https://www.linkedin.com/jobs/view/4443782677/ or a search-results URL with currentJobId",
			),
	}),
	outputSchema: z.object({
		ok: z.boolean(),
		jobId: z.string(),
		jobLink: z.string(),
		title: z.string(),
		company: z.string(),
		location: z.string(),
		description: z.string(),
		criteria: z.object({
			seniority: z.string().optional(),
			employmentType: z.string().optional(),
			jobFunction: z.string().optional(),
			industries: z.string().optional(),
		}),
		instruction: z.string(),
	}),
	execute: async (input, context) => {
		requireUserId(context?.requestContext);

		const ref = extractLinkedInJobId(input.url);
		if (!ref) {
			throw new Error(
				"Not a LinkedIn job URL. Expected /jobs/view/<id>/ or a search URL with currentJobId / jobId.",
			);
		}

		try {
			const handle = await tasks.trigger<typeof fetchLinkedInJob>(
				"fetch-linkedin-job",
				{ jobId: ref.jobId },
			);

			const run = await runs.poll<typeof fetchLinkedInJob>(handle.id, {
				pollIntervalMs: 750,
			});

			if (!run.isSuccess || !run.output) {
				const detail =
					run.error?.message?.slice(0, 800) ??
					`Fetch run ended with status ${run.status}`;
				throw new Error(detail);
			}

			const job = run.output;
			return {
				ok: true,
				jobId: job.jobId,
				jobLink: job.url,
				title: job.title,
				company: job.company,
				location: job.location,
				description: job.description,
				criteria: job.criteria ?? {},
				instruction:
					"Use description as the jobDescription for tailoring. Pass company as companyName, title as roleTitle, and jobLink to create_resume. Call get_resume_builder_notes next.",
			};
		} catch (error) {
			const message =
				error instanceof Error
					? error.message.slice(0, 800)
					: "Failed to fetch LinkedIn job";
			throw new Error(
				`Could not fetch LinkedIn job. Ensure TRIGGER_SECRET_KEY and FD_PROXY_URL are set and trigger.dev is running. (${message})`,
			);
		}
	},
});
