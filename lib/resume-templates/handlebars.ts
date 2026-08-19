import Handlebars from "handlebars";

import { dateRangeFromHelperArgs } from "@/lib/resume-templates/dates";
import {
	escapeHtml,
	hrefForHostPath,
	stripUrlScheme,
} from "@/lib/resume-templates/escape";
import { formatInlineMarkup } from "@/lib/resume-templates/inline-format";
import { sanitizeTemplateHtml } from "@/lib/resume-templates/sanitize-html";
import {
	assertNoObjectObject,
	stringifyTemplateValue,
} from "@/lib/resume-templates/stringify";

function safePlain(value: string) {
	return new Handlebars.SafeString(escapeHtml(value));
}

function escapeExpression(value: unknown) {
	if (
		value != null &&
		typeof value === "object" &&
		"toHTML" in value &&
		typeof (value as { toHTML?: unknown }).toHTML === "function"
	) {
		return (value as { toHTML: () => string }).toHTML();
	}
	if (value == null) {
		return "";
	}
	return formatInlineMarkup(value);
}

Handlebars.Utils.escapeExpression = escapeExpression;

const runtime = Handlebars.create();
runtime.registerHelper("rich", (value: unknown) => {
	return new Handlebars.SafeString(formatInlineMarkup(value));
});

runtime.registerHelper("eq", (a: unknown, b: unknown) => a === b);
runtime.registerHelper("ne", (a: unknown, b: unknown) => a !== b);
runtime.registerHelper(
	"and",
	(...args: unknown[]) => args.slice(0, -1).every(Boolean),
);
runtime.registerHelper(
	"or",
	(...args: unknown[]) => args.slice(0, -1).some(Boolean),
);
runtime.registerHelper("gt", (a: unknown, b: unknown) => Number(a) > Number(b));
runtime.registerHelper("len", (value: unknown) =>
	Array.isArray(value) ? value.length : 0,
);
runtime.registerHelper("hostPath", (value: unknown) =>
	safePlain(stripUrlScheme(stringifyTemplateValue(value))),
);
runtime.registerHelper("href", (value: unknown) =>
	safePlain(hrefForHostPath(stringifyTemplateValue(value))),
);
runtime.registerHelper("dateRange", (...args: unknown[]) =>
	dateRangeFromHelperArgs(args),
);
runtime.registerHelper("gpaScore", (value: unknown) => {
	const trimmed = stringifyTemplateValue(value).trim();
	if (!trimmed) {
		return "";
	}
	return trimmed.replace(/\s*(?:\/|out\s+of)\s*[\d.]+/gi, "").trim();
});
runtime.registerHelper("employment", (value: unknown) => {
	const trimmed = stringifyTemplateValue(value).trim();
	if (!trimmed || /not specified|unknown|n\/a|^none$/i.test(trimmed)) {
		return "";
	}
	return trimmed;
});
runtime.registerHelper("projectBody", (project: unknown) => {
	if (!project || typeof project !== "object") {
		return "";
	}
	const row = project as {
		stack?: unknown;
		bullets?: Array<{ label?: unknown; text?: unknown }>;
	};
	const bits: string[] = [];
	const stack = stringifyTemplateValue(row.stack).trim();
	if (stack) {
		bits.push(stack);
	}
	for (const bullet of row.bullets ?? []) {
		const rendered = stringifyTemplateValue(bullet).trim();
		if (rendered) {
			bits.push(rendered);
		}
	}
	return bits.join("; ");
});

export function renderHandlebarsHtml(
	templateHtml: string,
	data: Record<string, unknown>,
) {
	const compiled = runtime.compile(sanitizeTemplateHtml(templateHtml), {
		noEscape: false,
		strict: false,
	});
	const html = compiled(data);
	assertNoObjectObject(html);
	return html;
}
