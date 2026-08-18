const DATE_KEYS = new Set([
	"startdate",
	"enddate",
	"date",
	"period",
	"dates",
	"daterange",
	"month",
	"year",
]);

function asObject(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return null;
	}
	return value as Record<string, unknown>;
}

function typeOf(node: Record<string, unknown>): string | string[] | undefined {
	const type = node.type;
	if (typeof type === "string") {
		return type;
	}
	if (Array.isArray(type) && type.every((item) => typeof item === "string")) {
		return type as string[];
	}
	return undefined;
}

function hasType(node: Record<string, unknown>, expected: string): boolean {
	const type = typeOf(node);
	if (type === expected) {
		return true;
	}
	return Array.isArray(type) && type.includes(expected);
}

function fail(path: string, message: string): never {
	throw new Error(`inputSchema ${path || "/"} ${message}`);
}

function checkDateProperty(
	key: string,
	node: Record<string, unknown>,
	path: string,
) {
	if (!DATE_KEYS.has(key.toLowerCase())) {
		return;
	}
	if (!hasType(node, "string")) {
		fail(
			path,
			`must be type string (e.g. "Jun 2021" / "Present"), not ${JSON.stringify(typeOf(node) ?? "missing type")}`,
		);
	}
}

function checkExperience(node: Record<string, unknown>, path: string) {
	if (!hasType(node, "array")) {
		fail(path, "must be an array of companies with nested roles[]");
	}
	const items = asObject(node.items);
	const properties = asObject(items?.properties);
	if (!properties) {
		return;
	}
	if (!properties.roles) {
		fail(
			path,
			"entries must nest roles[] (group by company). Do not put title/dates on the company",
		);
	}
}

function checkBullets(node: Record<string, unknown>, path: string) {
	if (!hasType(node, "array")) {
		fail(path, "must be an array of { label?, text } objects");
	}
	const items = asObject(node.items);
	if (!items) {
		return;
	}
	if (hasType(items, "string")) {
		fail(path, "items must be { label?, text } objects, not strings");
	}
	const properties = asObject(items.properties);
	if (properties && !properties.text) {
		fail(path, "bullet objects must have a text string");
	}
}

function checkSkillItemsField(
	key: string,
	node: Record<string, unknown>,
	path: string,
) {
	if (key !== "items" || !/(^|\.)skills\[\]\.items$/.test(path)) {
		return;
	}
	if (hasType(node, "array")) {
		fail(path, "must be one comma-separated string, not an array");
	}
}

function walk(node: Record<string, unknown>, path: string) {
	const properties = asObject(node.properties);
	if (properties) {
		if (properties.month && properties.year) {
			fail(
				path,
				"must not model dates as { month, year }. Use startDate and endDate strings",
			);
		}
		const keys = Object.keys(properties);
		const rangeOnly =
			keys.length >= 2 &&
			keys.every((key) => ["start", "end", "from", "to"].includes(key));
		if (rangeOnly) {
			fail(
				path,
				"must not wrap dates as { start, end }. Use startDate and endDate strings on the role/school",
			);
		}

		for (const [key, raw] of Object.entries(properties)) {
			const child = asObject(raw);
			const childPath = path ? `${path}.${key}` : key;
			if (!child) {
				fail(childPath, "must be a JSON Schema object with a type");
			}
			if (
				typeOf(child) == null &&
				!asObject(child.properties) &&
				!asObject(child.items)
			) {
				fail(childPath, "must set type");
			}
			if (key === "experience") {
				checkExperience(child, childPath);
			}
			if (key === "bullets") {
				checkBullets(child, childPath);
			}
			checkSkillItemsField(key, child, childPath);
			checkDateProperty(key, child, childPath);
			walk(child, childPath);
		}
	}

	const items = asObject(node.items);
	if (items) {
		walk(items, `${path}[]`);
	}
}

export function assertAgentFillableSchema(
	schema: unknown,
): asserts schema is Record<string, unknown> {
	const root = asObject(schema);
	if (!root) {
		throw new Error("inputSchema must be a JSON Schema object, not a string");
	}
	if (root.type != null && !hasType(root, "object")) {
		throw new Error("inputSchema.type must be object");
	}
	if (!asObject(root.properties)) {
		throw new Error("inputSchema must have a properties object");
	}
	walk(root, "");
}
