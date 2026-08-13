import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { chromium } from "playwright";

import { db } from "@/lib/db";
import {
	getUserFileForUser,
	getUserFilesByKeys,
	insertUserFileRow,
} from "@/lib/db/files";
import {
	getResumeDocument,
	getResumeForUser,
	updateResumeForUser,
} from "@/lib/db/resumes";
import { userFiles } from "@/lib/db/schema";
import { putR2Object } from "@/lib/r2";
import { compileHtmlToPng } from "@/lib/resume-templates/html-to-image";
import { resolveTemplate } from "@/lib/resume-templates/registry";
import { normalizeTemplateRef } from "@/lib/resume-templates/refs";

export function resolveMastraSkillsDir() {
	return path.join(process.cwd(), "mastra", "skills");
}

export async function readResumeSkillNotes(
	name: "humanizer" | "resume-builder",
) {
	const notesPath = path.join(resolveMastraSkillsDir(), `${name}.md`);
	return fs.readFile(notesPath, "utf8");
}

function resumePdfKey(userId: string, resumeId: string) {
	return `users/${userId}/resumes/${resumeId}.pdf`;
}

function resumePreviewKey(userId: string, resumeId: string) {
	return `users/${userId}/resumes/${resumeId}-preview.png`;
}

function safeFilename(name: string, extension: "pdf" | "png") {
	const cleaned = name
		.replace(/[^\w\s.-]+/g, "")
		.trim()
		.replace(/\s+/g, "-")
		.slice(0, 80);
	return `${cleaned || "resume"}.${extension}`;
}

async function upsertResumeBinaryFile(input: {
	userId: string;
	existingFileId: string | null;
	key: string;
	filename: string;
	contentType: string;
	body: Buffer;
}) {
	let fileId = input.existingFileId;
	let existingFile = fileId
		? await getUserFileForUser(fileId, input.userId)
		: null;

	if (!existingFile) {
		const byKey = await getUserFilesByKeys([input.key], input.userId);
		existingFile = byKey[0] ?? null;
		fileId = existingFile?.id ?? null;
	}

	await putR2Object({
		key: input.key,
		body: input.body,
		contentType: input.contentType,
	});

	if (existingFile) {
		await db
			.update(userFiles)
			.set({
				key: input.key,
				filename: input.filename,
				contentType: input.contentType,
				size: input.body.byteLength,
			})
			.where(eq(userFiles.id, existingFile.id));
		return existingFile.id;
	}

	const row = await insertUserFileRow({
		id: nanoid(),
		userId: input.userId,
		key: input.key,
		filename: input.filename,
		contentType: input.contentType,
		size: input.body.byteLength,
	});
	return row.id;
}

export async function compileHtmlToPdf(html: string) {
	const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-compile-"));
	const htmlPath = path.join(workDir, "resume.html");

	try {
		await fs.writeFile(htmlPath, html, "utf8");

		const browser = await chromium.launch({
			headless: true,
		});
		try {
			const page = await browser.newPage();
			await page.goto(pathToFileURL(htmlPath).href, {
				waitUntil: "networkidle",
				timeout: 120_000,
			});
			await page.evaluate(async () => {
				if (document.fonts?.ready) {
					await document.fonts.ready;
				}
			});
			const pdfBuffer = await page.pdf({
				format: "A4",
				printBackground: true,
				preferCSSPageSize: true,
				margin: {
					top: "0",
					right: "0",
					bottom: "0",
					left: "0",
				},
			});
			await page.close();
			return Buffer.from(pdfBuffer);
		} finally {
			await browser.close();
		}
	} catch (error) {
		const message =
			error instanceof Error ? error.message.slice(0, 1500) : "PDF failed";
		throw new Error(`HTML to PDF compile failed: ${message}`);
	} finally {
		await fs.rm(workDir, { recursive: true, force: true }).catch(() => undefined);
	}
}

export async function compileResumePdf(input: {
	resumeId: string;
	userId: string;
}) {
	const resume = await getResumeForUser(input.resumeId, input.userId);
	if (!resume) {
		throw new Error("Resume not found");
	}

	await updateResumeForUser(input.resumeId, input.userId, {
		compileStatus: "compiling",
		compileError: null,
	});

	try {
		const templateRef = normalizeTemplateRef(resume.templateRef);
		const template = await resolveTemplate(templateRef, input.userId);
		const document = template.validate(getResumeDocument(resume));
		const html = template.render(document);
		const [pdfBuffer, pngBuffer] = await Promise.all([
			compileHtmlToPdf(html),
			compileHtmlToPng(html),
		]);

		const pdfFileId = await upsertResumeBinaryFile({
			userId: input.userId,
			existingFileId: resume.pdfFileId,
			key: resumePdfKey(input.userId, input.resumeId),
			filename: safeFilename(resume.name, "pdf"),
			contentType: "application/pdf",
			body: pdfBuffer,
		});
		const previewFileId = await upsertResumeBinaryFile({
			userId: input.userId,
			existingFileId: resume.previewFileId,
			key: resumePreviewKey(input.userId, input.resumeId),
			filename: safeFilename(resume.name, "png"),
			contentType: "image/png",
			body: pngBuffer,
		});

		const updated = await updateResumeForUser(input.resumeId, input.userId, {
			pdfFileId,
			previewFileId,
			compileStatus: "ready",
			compileError: null,
			compiledAt: new Date(),
		});

		return updated;
	} catch (error) {
		const message =
			error instanceof Error ? error.message.slice(0, 2000) : "Compile failed";
		await updateResumeForUser(input.resumeId, input.userId, {
			compileStatus: "failed",
			compileError: message,
		});
		throw error;
	}
}
