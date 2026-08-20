import { prettifyError, z } from "zod";

export function jsonSchemaFromZod(schema: z.ZodType) {
	return z.toJSONSchema(schema, {
		target: "draft-2020-12",
		reused: "inline",
	}) as Record<string, unknown>;
}

function isPresent(value: unknown): boolean {
	return value !== undefined && value !== null && value !== "";
}

// Merges the shape of every sibling occurrence of a value (e.g. every item in
// an array, every value seen at the same key across sibling objects) instead
// of only inspecting the first one. A field is only marked required if it is
// present in *every* occurrence — otherwise later items with fewer fields
// than the first item would fail validation against an overly strict schema.
function mergeSchemas(values: unknown[]): Record<string, unknown> {
	const defined = values.filter((value) => value !== undefined);
	if (defined.length === 0) {
		return { type: "string" };
	}

	if (defined.some((value) => Array.isArray(value))) {
		const items = defined
			.filter((value): value is unknown[] => Array.isArray(value))
			.flat();
		const nonNullItems = items.filter((item) => item != null);
		return {
			type: "array",
			items:
				nonNullItems.length === 0
					? { type: "string" }
					: mergeSchemas(nonNullItems),
		};
	}

	if (defined.some((value) => value != null && typeof value === "object")) {
		const objects = defined.filter(
			(value): value is Record<string, unknown> =>
				value != null && typeof value === "object",
		);
		const keys = new Set<string>();
		for (const object of objects) {
			for (const key of Object.keys(object)) {
				keys.add(key);
			}
		}
		const properties: Record<string, unknown> = {};
		const required: string[] = [];
		for (const key of keys) {
			const valuesAtKey = objects.map((object) => object[key]);
			properties[key] = mergeSchemas(valuesAtKey);
			if (valuesAtKey.every((value) => isPresent(value))) {
				required.push(key);
			}
		}
		return {
			type: "object",
			properties,
			required,
			additionalProperties: false,
		};
	}

	const first = defined[0];
	if (typeof first === "number") {
		return { type: "number" };
	}
	if (typeof first === "boolean") {
		return { type: "boolean" };
	}
	return { type: "string" };
}

export function jsonSchemaFromSampleData(
	sample: Record<string, unknown>,
): Record<string, unknown> {
	return mergeSchemas([sample]);
}

function humanizeSchemaKey(key: string): string {
	if (!key) {
		return "";
	}
	const spaced = key
		.replace(/[_-]+/g, " ")
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.trim();
	return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function placeholderForSchemaNode(node: unknown, keyHint: string): unknown {
	if (!node || typeof node !== "object") {
		return humanizeSchemaKey(keyHint) || "Sample text";
	}
	const schema = node as Record<string, unknown>;
	const properties = schema.properties;
	if (
		schema.type === "object" ||
		(properties && typeof properties === "object" && !Array.isArray(properties))
	) {
		const result: Record<string, unknown> = {};
		for (const [key, child] of Object.entries(
			(properties as Record<string, unknown>) ?? {},
		)) {
			result[key] = placeholderForSchemaNode(child, key);
		}
		return result;
	}
	if (schema.type === "array") {
		const item = placeholderForSchemaNode(schema.items, keyHint);
		return [item, item];
	}
	if (schema.type === "number") {
		return 0;
	}
	if (schema.type === "boolean") {
		return true;
	}
	const description =
		typeof schema.description === "string" ? schema.description : "";
	return description || humanizeSchemaKey(keyHint) || "Sample text";
}

// Generates plausible placeholder content purely from a JSON Schema's shape
// (property names, descriptions) so a template preview can render even when
// no real resume document exists yet for it.
export function placeholderDataFromSchema(
	schema: Record<string, unknown>,
): Record<string, unknown> {
	const result = placeholderForSchemaNode(schema, "");
	return result && typeof result === "object" && !Array.isArray(result)
		? (result as Record<string, unknown>)
		: {};
}

export function isEmptyDocumentSchema(schema: unknown): boolean {
	if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
		return true;
	}
	const properties = (schema as Record<string, unknown>).properties;
	if (
		properties &&
		typeof properties === "object" &&
		!Array.isArray(properties)
	) {
		return Object.keys(properties).length === 0;
	}
	return true;
}

function unwrapJsonSchema(value: unknown): Record<string, unknown> | null {
	let next: unknown = value;
	if (typeof next === "string") {
		try {
			next = JSON.parse(next);
		} catch {
			return null;
		}
	}
	if (!next || typeof next !== "object" || Array.isArray(next)) {
		return null;
	}
	const row = next as Record<string, unknown>;
	if (row.properties && typeof row.properties === "object") {
		return row;
	}
	if (row.schema && row.schema !== next) {
		return unwrapJsonSchema(row.schema);
	}
	if (row.jsonSchema && row.jsonSchema !== next) {
		return unwrapJsonSchema(row.jsonSchema);
	}
	const meta = new Set([
		"$schema",
		"$defs",
		"title",
		"description",
		"type",
		"required",
		"additionalProperties",
	]);
	const fieldKeys = Object.keys(row).filter((key) => !meta.has(key));
	if (
		fieldKeys.length > 0 &&
		fieldKeys.every((key) => {
			const value = row[key];
			return value != null && typeof value === "object";
		})
	) {
		return {
			type: "object",
			properties: Object.fromEntries(fieldKeys.map((key) => [key, row[key]])),
			additionalProperties: false,
		};
	}
	return row;
}

export function coerceDocumentJsonSchema(
	schema: unknown,
	sampleData?: Record<string, unknown>,
): Record<string, unknown> {
	let next = unwrapJsonSchema(schema);
	if (isEmptyDocumentSchema(next) && sampleData && Object.keys(sampleData).length > 0) {
		next = jsonSchemaFromSampleData(sampleData);
	}
	if (isEmptyDocumentSchema(next) || !next) {
		throw new Error(
			"Template schema is empty. The model returned no JSON Schema properties and no sampleData.",
		);
	}
	return next;
}

export function zodFromStoredSchema(
	schema: Record<string, unknown>,
	options?: { strict?: boolean },
) {
	if (isEmptyDocumentSchema(schema)) {
		if (options?.strict) {
			throw new Error(
				"Template schema is empty. The model returned no JSON Schema properties and no sampleData.",
			);
		}
		return z.record(z.string(), z.unknown());
	}
	try {
		return z.fromJSONSchema(schema as Parameters<typeof z.fromJSONSchema>[0]);
	} catch (error) {
		if (options?.strict) {
			const message =
				error instanceof Error ? error.message : "invalid JSON Schema";
			throw new Error(`Could not convert template schema to Zod: ${message}`);
		}
		return z.record(z.string(), z.unknown());
	}
}

export function parseWithZod(
	schema: z.ZodType,
	data: unknown,
): Record<string, unknown> {
	const result = schema.safeParse(data);
	if (!result.success) {
		throw new Error(
			`Document does not match this template's schema:\n${prettifyError(result.error)}`,
		);
	}
	return result.data as Record<string, unknown>;
}
