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
import { normalizeJobPostingUrl } from "@/lib/job-postings";
import { extractLinkedInJobId, isLinkedInJobUrl } from "@/lib/linkedin-jobs";
import { queueResumeCompile } from "@/lib/resume-compile";
import {
	resolveTemplate,
	resolveUserSelectedTemplate,
} from "@/lib/resume-templates/registry";
import { applyResumePatches } from "@/lib/resume-templates/patch";
import { normalizeTemplateRef } from "@/lib/resume-templates/refs";
import type { fetchJobPosting } from "@/trigger/fetch-job-posting";
import type { fetchLinkedInJob } from "@/trigger/fetch-linkedin-job";

const JOB_POSTING_FALLBACK =
	"We could not load this job posting. Ask the user to paste the job description text or send screenshots of the posting. Do not invent a job description and do not call create_resume until you have the posting.";

const TURN_RESUME_ID_KEY = "turnResumeId";

type ToolRequestContext = {
	get: (key: string) => unknown;
	set?: (key: string, value: unknown) => void;
};

function requireUserId(requestContext: ToolRequestContext | undefined) {
	const userId = requestContext?.get("userId");
	if (typeof userId !== "string" || !userId) {
		throw new Error("Unauthorized");
	}
	return userId;
}

function getTurnResumeId(requestContext: ToolRequestContext | undefined) {
	const id = requestContext?.get(TURN_RESUME_ID_KEY);
	return typeof id === "string" && id ? id : null;
}

function setTurnResumeId(
	requestContext: ToolRequestContext | undefined,
	id: string,
) {
	requestContext?.set?.(TURN_RESUME_ID_KEY, id);
}

export async function documentSchemaFromRequest(
	requestContext: ToolRequestContext | undefined,
) {
	const userId =
		typeof requestContext?.get === "function"
			? requestContext.get("userId")
			: undefined;
	if (typeof userId !== "string" || !userId) {
		return z.record(z.string(), z.unknown());
	}
	try {
		const template = await resolveUserSelectedTemplate(userId);
		return template.documentSchema;
	} catch {
		return z.record(z.string(), z.unknown());
	}
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

export function resumeLinkPayload(row: {
	id: string;
	name: string;
	compileStatus: string;
}) {
	return {
		previewUrl: resumePreviewUrl(row.id),
		downloadUrl: resumeDownloadUrl(row.id),
		resumesPath: "/resumes",
		compileStatus: row.compileStatus,
		instruction:
			"The PDF compiles in the background and is shown in chat. Share the downloadUrl. Do not fetch the PDF yourself.",
	};
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
		"Read this template's layout notes and JSON schema. Pass resumeId when editing an existing resume so notes/schema match that resume even if the user changed their default template.",
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

export function makeCreateResumeTool(documentSchema: z.ZodType) {
	return createTool({
	id: "create_resume",
	description:
		"Create a resume from structured document JSON and queue the PDF. document must match this template's schema. Never send a Typst, LaTeX, or full HTML resume. Prose slots (summary, bullet text) use inline HTML: <strong>, <em>, <a href>. No markdown. website/github/linkedin/url/companyUrl must be a plain host/path or https URL. One resume per turn — later edits use patch_resume on this id. When tailored to a job, always pass companyName, roleTitle, and jobLink when known.",
	inputSchema: z.object({
		name: z
			.string()
			.min(1)
			.max(200)
			.describe(
				"Display name for this resume, preferably like 'Role @ Company' when tailored",
			),
		document: documentSchema.describe(
			"Structured resume JSON matching this template's schema.",
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
		previewUrl: z.string(),
		downloadUrl: z.string(),
		resumesPath: z.string(),
		instruction: z.string(),
	}),
	execute: async (input, context) => {
		const userId = requireUserId(context?.requestContext);
		const turnResumeId = getTurnResumeId(context?.requestContext);

		if (turnResumeId) {
			const existing = await getResumeForUser(turnResumeId, userId);
			if (!existing) {
				throw new Error("Resume not found");
			}
			const template = await resolveTemplate(
				normalizeTemplateRef(existing.templateRef),
				userId,
			);
			const document = template.validate(input.document);
			const row = await updateResumeForUser(turnResumeId, userId, {
				name: input.name,
				document,
				jobDescription: input.jobDescription,
				companyName: input.companyName,
				roleTitle: input.roleTitle,
				jobLink: input.jobLink,
			});
			if (!row) {
				throw new Error("Resume not found");
			}
			const queued = await queueResumeCompile({
				resumeId: row.id,
				userId,
			});
			return {
				id: queued.resume.id,
				name: queued.resume.name,
				companyName: queued.resume.companyName,
				roleTitle: queued.resume.roleTitle,
				jobLink: queued.resume.jobLink,
				templateRef: queued.resume.templateRef,
				updatedAt: queued.resume.updatedAt.toISOString(),
				...resumeLinkPayload(queued.resume),
			};
		}

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
		setTurnResumeId(context?.requestContext, row.id);
		const queued = await queueResumeCompile({
			resumeId: row.id,
			userId,
		});
		return {
			id: queued.resume.id,
			name: queued.resume.name,
			companyName: queued.resume.companyName,
			roleTitle: queued.resume.roleTitle,
			jobLink: queued.resume.jobLink,
			templateRef: queued.resume.templateRef,
			updatedAt: queued.resume.updatedAt.toISOString(),
			...resumeLinkPayload(queued.resume),
		};
	},
});
}

const resumePatchSchema = z.object({
	op: z
		.enum(["replace", "add", "remove"])
		.describe("replace an existing slot, add a list item, or remove a path"),
	path: z
		.string()
		.min(2)
		.describe(
			"JSON Pointer from the document root, e.g. /summary or /experience/0/roles/0/dates. Append to a list with /skills/- or /experience/0/roles/0/bullets/-",
		),
	value: z
		.any()
		.optional()
		.describe("Required for replace and add. Omit for remove."),
});

export function makePatchResumeTool(documentSchema: z.ZodType) {
	return createTool({
	id: "patch_resume",
	description:
		"Patch an existing resume and queue a new PDF. Send only the slots that change as JSON Pointer ops — do not resend the full document. Prose values use inline HTML (<strong>, <em>, <a href>), not markdown. After apply, the document must still match this template's schema.",
	inputSchema: z.object({
		id: z.string().min(1),
		patches: z
			.array(resumePatchSchema)
			.min(1)
			.describe("Ordered patches. Applied in order to the saved document."),
	}),
	outputSchema: z.object({
		ok: z.boolean(),
		id: z.string(),
		name: z.string(),
		applied: z.number(),
		document: documentSchema,
		updatedAt: z.string().nullable(),
		compileStatus: z.string(),
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
		const template = await resolveTemplate(
			normalizeTemplateRef(existing.templateRef),
			userId,
		);
		const patched = applyResumePatches(
			getResumeDocument(existing),
			input.patches,
		);
		const document = template.validate(patched);
		const row = await replaceResumeDocument(input.id, userId, document);
		if (!row) {
			throw new Error("Resume not found");
		}
		setTurnResumeId(context?.requestContext, row.id);
		const queued = await queueResumeCompile({
			resumeId: row.id,
			userId,
		});
		return {
			ok: true,
			id: queued.resume.id,
			name: queued.resume.name,
			applied: input.patches.length,
			document,
			updatedAt: queued.resume.updatedAt.toISOString(),
			...resumeLinkPayload(queued.resume),
		};
	},
});
}

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
		"Queue a PDF compile for an existing resume. create_resume and patch_resume already do this — only call for a resume that has no PDF yet.",
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

		const queued = await queueResumeCompile({
			resumeId: input.id,
			userId,
		});

		return {
			ok: true,
			id: queued.resume.id,
			name: queued.resume.name,
			runId: queued.runId,
			...resumeLinkPayload(queued.resume),
		};
	},
});

export const getResumeDownloadTool = createTool({
	id: "get_resume_download",
	description:
		"Get preview/download URLs for a resume. The PDF may still be compiling — share the URLs anyway.",
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
		return {
			previewUrl: resumePreviewUrl(row.id),
			downloadUrl: resumeDownloadUrl(row.id),
			resumesPath: "/resumes",
			compileStatus: row.compileStatus,
			name: row.name,
			instruction:
				"Give the user this downloadUrl. The PDF card in chat updates when compile finishes. Do not download or fetch the PDF yourself.",
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
					"Use description as the jobDescription for tailoring. Pass company as companyName, title as roleTitle, and jobLink to create_resume.",
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

export const fetchJobPostingTool = createTool({
	id: "fetch_job_posting",
	description:
		"Fetch a job posting from a public careers URL (Workday, Greenhouse, Lever, Ashby, company jobs pages, etc.). Call when the user pasted a job link that is not a LinkedIn jobs URL and did not paste the full job description. If ok is false, tell the user we could not load the page and ask them to paste the job text or send screenshots. Do not use for linkedin.com/jobs — use fetch_linkedin_job instead.",
	inputSchema: z.object({
		url: z
			.string()
			.min(1)
			.describe(
				"Public job posting URL, e.g. a Workday, Greenhouse, Lever, Ashby, or company careers link",
			),
	}),
	outputSchema: z.object({
		ok: z.boolean(),
		url: z.string(),
		title: z.string().optional(),
		company: z.string().optional(),
		location: z.string().optional(),
		description: z.string().optional(),
		instruction: z.string(),
	}),
	execute: async (input, context) => {
		requireUserId(context?.requestContext);

		if (isLinkedInJobUrl(input.url)) {
			return {
				ok: false,
				url: input.url,
				instruction:
					"This is a LinkedIn job URL. Call fetch_linkedin_job with the same URL instead of fetch_job_posting.",
			};
		}

		const parsedUrl = normalizeJobPostingUrl(input.url);
		if (!parsedUrl) {
			return {
				ok: false,
				url: input.url,
				instruction: JOB_POSTING_FALLBACK,
			};
		}

		try {
			const handle = await tasks.trigger<typeof fetchJobPosting>(
				"fetch-job-posting",
				{ url: parsedUrl.toString() },
			);

			const run = await runs.poll<typeof fetchJobPosting>(handle.id, {
				pollIntervalMs: 750,
			});

			if (!run.isSuccess || !run.output) {
				return {
					ok: false,
					url: parsedUrl.toString(),
					instruction: JOB_POSTING_FALLBACK,
				};
			}

			const job = run.output;
			if (!job.ok || !job.description) {
				return {
					ok: false,
					url: job.url || parsedUrl.toString(),
					instruction: JOB_POSTING_FALLBACK,
				};
			}

			return {
				ok: true,
				url: job.url,
				title: job.title,
				company: job.company,
				location: job.location,
				description: job.description,
				instruction:
					"Use description as the jobDescription for tailoring. Pass company as companyName, title as roleTitle, and url as jobLink to create_resume.",
			};
		} catch {
			return {
				ok: false,
				url: parsedUrl.toString(),
				instruction: JOB_POSTING_FALLBACK,
			};
		}
	},
});
