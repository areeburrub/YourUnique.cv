import { promises as fs } from "node:fs";
import path from "node:path";

export function resolveMastraSkillsDir() {
	return path.join(process.cwd(), "mastra", "skills");
}

export async function readResumeSkillNotes(
	name: "humanizer" | "resume-builder",
) {
	const notesPath = path.join(resolveMastraSkillsDir(), `${name}.md`);
	return fs.readFile(notesPath, "utf8");
}
