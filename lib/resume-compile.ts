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
import { getResumeForUser, updateResumeForUser } from "@/lib/db/resumes";
import { userFiles } from "@/lib/db/schema";
import { putR2Object } from "@/lib/r2";

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

async function resolveTectonicBinary() {
	if (process.env.TECTONIC_PATH) {
		return process.env.TECTONIC_PATH;
	}

	const candidates = [
		path.join(os.homedir(), ".local", "bin", "tectonic"),
		"/usr/local/bin/tectonic",
		"tectonic",
	];

	for (const candidate of candidates) {
		if (candidate === "tectonic") {
			return candidate;
		}
		try {
			await fs.access(candidate);
			return candidate;
		} catch {
			// try next
		}
	}

	return "tectonic";
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

async function compileTexToPdf(sourceTex: string) {
	const templateDir = resolveResumeTemplateDir();
	const mainTexPath = path.join(templateDir, "main.tex");

	try {
		await fs.access(mainTexPath);
	} catch {
		throw new Error(
			`Resume template is not configured. Missing ${mainTexPath}.`,
		);
	}

	const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-compile-"));

	try {
		await fs.copyFile(mainTexPath, path.join(workDir, "main.tex"));
		await fs.writeFile(path.join(workDir, "resume.tex"), sourceTex, "utf8");

		const tectonicBin = await resolveTectonicBinary();
		try {
			await execFileAsync(tectonicBin, ["main.tex"], {
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
				`Tectonic compile failed${details ? `: ${details.slice(-1500)}` : ""}`,
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
		const pdfBuffer = await compileTexToPdf(resume.sourceTex);
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
