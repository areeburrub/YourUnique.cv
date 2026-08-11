import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

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
import { renderResumeTypst } from "@/lib/resume-render-typst";

const execFileAsync = promisify(execFile);

export function resolveResumeTemplateDir() {
	return path.join(process.cwd(), "templates", "resume");
}

export function resolveMastraSkillsDir() {
	return path.join(process.cwd(), "mastra", "skills");
}

export async function readResumeTemplateNotes() {
	const notesPath = path.join(resolveResumeTemplateDir(), "TEMPLATE_NOTES.md");
	return fs.readFile(notesPath, "utf8");
}

export async function readResumeSkillNotes(
	name: "humanizer" | "resume-builder",
) {
	const notesPath = path.join(resolveMastraSkillsDir(), `${name}.md`);
	return fs.readFile(notesPath, "utf8");
}

async function resolveTypstBinary() {
	if (process.env.TYPST_PATH) {
		return process.env.TYPST_PATH;
	}

	const candidates = [
		path.join(os.homedir(), ".local", "bin", "typst"),
		"/usr/local/bin/typst",
		"typst",
	];

	for (const candidate of candidates) {
		if (candidate === "typst") {
			return candidate;
		}
		try {
			await fs.access(candidate);
			return candidate;
		} catch {
			// try next
		}
	}

	return "typst";
}

function resumePdfKey(userId: string, resumeId: string) {
	return `users/${userId}/resumes/${resumeId}.pdf`;
}

function safeFilename(name: string) {
	const cleaned = name
		.replace(/[^\w\s.-]+/g, "")
		.trim()
		.replace(/\s+/g, "-")
		.slice(0, 80);
	return `${cleaned || "resume"}.pdf`;
}

async function compileTypstToPdf(sourceTyp: string) {
	const templateDir = resolveResumeTemplateDir();
	const libTypPath = path.join(templateDir, "lib.typ");

	try {
		await fs.access(libTypPath);
	} catch {
		throw new Error(
			`Resume template is not configured. Missing ${libTypPath}.`,
		);
	}

	const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-compile-"));

	try {
		await fs.copyFile(libTypPath, path.join(workDir, "lib.typ"));
		await fs.writeFile(path.join(workDir, "resume.typ"), sourceTyp, "utf8");

		const typstBin = await resolveTypstBinary();
		try {
			await execFileAsync(typstBin, ["compile", "resume.typ", "main.pdf"], {
				cwd: workDir,
				timeout: 180_000,
				maxBuffer: 10 * 1024 * 1024,
				env: process.env,
			});
		} catch (error) {
			const stderr =
				error && typeof error === "object" && "stderr" in error
					? String((error as { stderr?: Buffer | string }).stderr ?? "")
					: "";
			const stdout =
				error && typeof error === "object" && "stdout" in error
					? String((error as { stdout?: Buffer | string }).stdout ?? "")
					: "";
			const details = `${stdout}\n${stderr}`.trim();
			throw new Error(
				`Typst compile failed${details ? `: ${details.slice(-1500)}` : ""}`,
			);
		}

		return fs.readFile(path.join(workDir, "main.pdf"));
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
		const document = getResumeDocument(resume);
		const sourceTyp = renderResumeTypst(document);
		const pdfBuffer = await compileTypstToPdf(sourceTyp);
		const key = resumePdfKey(input.userId, input.resumeId);
		const filename = safeFilename(resume.name);

		await putR2Object({
			key,
			body: pdfBuffer,
			contentType: "application/pdf",
		});

		let pdfFileId = resume.pdfFileId;
		let existingFile = pdfFileId
			? await getUserFileForUser(pdfFileId, input.userId)
			: null;

		if (!existingFile) {
			const byKey = await getUserFilesByKeys([key], input.userId);
			existingFile = byKey[0] ?? null;
			pdfFileId = existingFile?.id ?? null;
		}

		if (existingFile) {
			await db
				.update(userFiles)
				.set({
					key,
					filename,
					contentType: "application/pdf",
					size: pdfBuffer.byteLength,
				})
				.where(eq(userFiles.id, existingFile.id));
			pdfFileId = existingFile.id;
		} else {
			const row = await insertUserFileRow({
				id: nanoid(),
				userId: input.userId,
				key,
				filename,
				contentType: "application/pdf",
				size: pdfBuffer.byteLength,
			});
			pdfFileId = row.id;
		}

		const updated = await updateResumeForUser(input.resumeId, input.userId, {
			pdfFileId,
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
