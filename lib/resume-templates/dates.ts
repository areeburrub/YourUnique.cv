const MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

const DATE_KEYS = new Set([
	"month",
	"year",
	"day",
	"date",
	"present",
	"current",
	"start",
	"end",
	"startDate",
	"endDate",
	"from",
	"to",
	"value",
	"formatted",
]);

export function isHandlebarsOptions(value: unknown): boolean {
	if (!value || typeof value !== "object") {
		return false;
	}
	const row = value as Record<string, unknown>;
	return (
		typeof row.name === "string" &&
		row.hash != null &&
		typeof row.hash === "object" &&
		"data" in row
	);
}

function asRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return null;
	}
	if (isHandlebarsOptions(value)) {
		return null;
	}
	return value as Record<string, unknown>;
}

function pick(row: Record<string, unknown>, keys: string[]): unknown {
	for (const key of keys) {
		if (row[key] != null && row[key] !== "") {
			return row[key];
		}
	}
	return undefined;
}

function formatMonth(value: unknown): string {
	if (typeof value === "number" && value >= 1 && value <= 12) {
		return MONTHS[value - 1] ?? "";
	}
	if (typeof value !== "string") {
		return "";
	}
	const trimmed = value.trim();
	if (/^\d{1,2}$/.test(trimmed)) {
		const month = Number(trimmed);
		if (month >= 1 && month <= 12) {
			return MONTHS[month - 1] ?? trimmed;
		}
	}
	return trimmed;
}

function formatYear(value: unknown): string {
	if (typeof value === "number" && Number.isFinite(value)) {
		return String(value);
	}
	if (typeof value === "string") {
		return value.trim();
	}
	return "";
}

export function looksLikeDate(value: unknown): boolean {
	if (value instanceof Date) {
		return true;
	}
	const row = asRecord(value);
	if (!row) {
		return false;
	}
	const keys = Object.keys(row);
	return keys.length > 0 && keys.every((key) => DATE_KEYS.has(key));
}

export function formatDateValue(value: unknown): string {
	if (value == null || value === "" || isHandlebarsOptions(value)) {
		return "";
	}
	if (typeof value === "number" && Number.isFinite(value)) {
		return String(value);
	}
	if (typeof value === "string") {
		return value.trim();
	}
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return value.toLocaleDateString("en-US", {
			month: "short",
			year: "numeric",
		});
	}

	const row = asRecord(value);
	if (!row) {
		return "";
	}

	if (row.present === true || row.current === true) {
		return "Present";
	}

	const month = formatMonth(row.month);
	const year = formatYear(row.year);
	if (month || year) {
		return [month, year].filter(Boolean).join(" ");
	}

	const start = pick(row, ["start", "from", "begin"]);
	const end = pick(row, ["end", "to"]);
	if (start != null || end != null) {
		return formatDateRange(start, end);
	}

	const single = pick(row, ["value", "date", "formatted", "text", "label"]);
	if (single != null && single !== value) {
		return formatDateValue(single);
	}

	return "";
}

export function formatDateRange(start: unknown, end: unknown): string {
	const from = formatDateValue(start);
	const to = formatDateValue(end);
	if (from && to) {
		return `${from} – ${to}`;
	}
	return from || to;
}

export function dateRangeFromHelperArgs(args: unknown[]): string {
	const options = args.find(isHandlebarsOptions) as
		| { hash?: Record<string, unknown> }
		| undefined;
	const positional = args.filter((value) => !isHandlebarsOptions(value));
	const hash = options?.hash ?? {};

	const start =
		hash.start ?? hash.startDate ?? hash.from ?? positional[0];
	const end = hash.end ?? hash.endDate ?? hash.to ?? positional[1];

	if (
		end == null &&
		start &&
		typeof start === "object" &&
		!isHandlebarsOptions(start)
	) {
		const row = start as Record<string, unknown>;
		if (
			row.start != null ||
			row.end != null ||
			row.startDate != null ||
			row.endDate != null ||
			row.from != null ||
			row.to != null
		) {
			return formatDateRange(
				row.start ?? row.startDate ?? row.from,
				row.end ?? row.endDate ?? row.to,
			);
		}
	}

	return formatDateRange(start, end);
}
