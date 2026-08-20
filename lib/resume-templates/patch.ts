import { z } from "zod";

export type ResumePatch = {
	op: "replace" | "add" | "remove";
	path: string;
	value?: unknown;
};

// Same JSON Pointer patch shape as ResumePatch, reused for patching a
// template's JSON Schema (applyResumePatches is generic over any JSON object).
export const jsonPatchSchema = z.object({
	op: z.enum(["replace", "add", "remove"]),
	path: z
		.string()
		.min(1)
		.describe(
			'JSON Pointer, e.g. "/properties/certifications" or "/required/-".',
		),
	value: z
		.unknown()
		.optional()
		.describe("Required for add/replace, omit for remove."),
});

function decodeToken(token: string) {
	return token.replace(/~1/g, "/").replace(/~0/g, "~");
}

function parsePointer(path: string): string[] {
	if (!path.startsWith("/")) {
		throw new Error("path must be a JSON Pointer starting with /");
	}
	if (path === "/") {
		throw new Error("cannot patch the document root");
	}
	return path.slice(1).split("/").map(decodeToken);
}

function resolveParent(root: Record<string, unknown>, tokens: string[]) {
	let current: unknown = root;
	for (const token of tokens) {
		if (current == null || typeof current !== "object") {
			throw new Error(`cannot walk to "${token}"`);
		}
		if (Array.isArray(current)) {
			if (!/^(0|[1-9]\d*)$/.test(token)) {
				throw new Error(`invalid array index "${token}"`);
			}
			const index = Number(token);
			if (index < 0 || index >= current.length) {
				throw new Error(`array index ${token} out of range`);
			}
			current = current[index];
			continue;
		}
		if (!Object.hasOwn(current, token)) {
			throw new Error(`missing "${token}"`);
		}
		current = (current as Record<string, unknown>)[token];
	}
	return current;
}

function asArrayIndex(key: string) {
	if (!/^(0|[1-9]\d*)$/.test(key)) {
		return null;
	}
	return Number(key);
}

function replaceOn(parent: unknown, key: string, value: unknown) {
	if (Array.isArray(parent)) {
		const index = asArrayIndex(key);
		if (index == null || index < 0 || index >= parent.length) {
			throw new Error(`replace target ${key} does not exist`);
		}
		parent[index] = value;
		return;
	}
	if (!parent || typeof parent !== "object" || !Object.hasOwn(parent, key)) {
		throw new Error(`replace target "${key}" does not exist`);
	}
	(parent as Record<string, unknown>)[key] = value;
}

function addOn(parent: unknown, key: string, value: unknown) {
	if (Array.isArray(parent)) {
		if (key === "-") {
			parent.push(value);
			return;
		}
		const index = asArrayIndex(key);
		if (index == null || index < 0 || index > parent.length) {
			throw new Error(`add index ${key} out of range`);
		}
		parent.splice(index, 0, value);
		return;
	}
	if (!parent || typeof parent !== "object") {
		throw new Error("add target is not an object");
	}
	(parent as Record<string, unknown>)[key] = value;
}

function removeOn(parent: unknown, key: string) {
	if (Array.isArray(parent)) {
		const index = asArrayIndex(key);
		if (index == null || index < 0 || index >= parent.length) {
			throw new Error(`remove target ${key} does not exist`);
		}
		parent.splice(index, 1);
		return;
	}
	if (!parent || typeof parent !== "object" || !Object.hasOwn(parent, key)) {
		throw new Error(`remove target "${key}" does not exist`);
	}
	delete (parent as Record<string, unknown>)[key];
}

export function applyResumePatches(
	document: Record<string, unknown>,
	patches: ResumePatch[],
): Record<string, unknown> {
	if (patches.length === 0) {
		throw new Error("at least one patch is required");
	}

	const next = structuredClone(document);

	for (const [index, patch] of patches.entries()) {
		try {
			const tokens = parsePointer(patch.path);
			const key = tokens[tokens.length - 1]!;
			const parent = resolveParent(next, tokens.slice(0, -1));
			if (patch.op === "remove") {
				removeOn(parent, key);
				continue;
			}
			if (patch.value === undefined) {
				throw new Error("value is required");
			}
			if (patch.op === "replace") {
				replaceOn(parent, key, patch.value);
				continue;
			}
			addOn(parent, key, patch.value);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "failed";
			throw new Error(
				`Patch ${index + 1} (${patch.op} ${patch.path}): ${message}`,
			);
		}
	}

	return next;
}
