import { formatDateRange, formatDateValue, isHandlebarsOptions, looksLikeDate } from "@/lib/resume-templates/dates";

const FALLBACK_KEYS = [
	"name",
	"title",
	"company",
	"school",
	"category",
	"degree",
	"label",
	"value",
	"url",
	"href",
	"formatted",
	"items",
	"email",
	"phone",
] as const;

export function stringifyTemplateValue(value: unknown): string {
	if (value == null || value === false) {
		return "";
	}
	if (isHandlebarsOptions(value)) {
		return "";
	}
	if (typeof value === "string") {
		return value;
	}
	if (typeof value === "number" && Number.isFinite(value)) {
		return String(value);
	}
	if (typeof value === "boolean") {
		return "";
	}
	if (Array.isArray(value)) {
		return value.map(stringifyTemplateValue).filter(Boolean).join(", ");
	}
	if (looksLikeDate(value)) {
		const date = formatDateValue(value);
		if (date) {
			return date;
		}
	}
	if (typeof value !== "object") {
		return "";
	}

	const row = value as Record<string, unknown>;
	if (row.text != null && row.text !== "") {
		const label = stringifyTemplateValue(row.label).trim();
		const text = stringifyTemplateValue(row.text);
		return label ? `${label}: ${text}` : text;
	}

	const date = formatDateValue(value);
	if (date) {
		return date;
	}

	const range = formatDateRange(
		row.startDate ?? row.start ?? row.from,
		row.endDate ?? row.end ?? row.to,
	);
	if (range) {
		return range;
	}

	for (const key of FALLBACK_KEYS) {
		if (row[key] != null && row[key] !== "") {
			return stringifyTemplateValue(row[key]);
		}
	}

	return "";
}

export function assertNoObjectObject(html: string) {
	if (/\[object Object\]/i.test(html)) {
		throw new Error(
			"Template interpolated an object as [object Object]. Bind strings ({{text}}, {{dateRange startDate endDate}}) instead of whole objects.",
		);
	}
}
