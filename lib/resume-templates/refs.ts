import {
	DEFAULT_TEMPLATE_REF,
	type TemplateKind,
	type TemplateRef,
} from "@/lib/resume-templates/types";

export function isTemplateRef(value: string): value is TemplateRef {
	return value.startsWith("builtin:") || value.startsWith("custom:");
}

export function parseTemplateRef(ref: string): {
	kind: TemplateKind;
	id: string;
} {
	if (ref.startsWith("builtin:")) {
		const id = ref.slice("builtin:".length);
		if (!id) {
			throw new Error("Invalid builtin template ref");
		}
		return { kind: "builtin", id };
	}
	if (ref.startsWith("custom:")) {
		const id = ref.slice("custom:".length);
		if (!id) {
			throw new Error("Invalid custom template ref");
		}
		return { kind: "custom", id };
	}
	throw new Error(`Unknown template ref: ${ref}`);
}

export function builtinRef(id: string): TemplateRef {
	return `builtin:${id}`;
}

export function customRef(id: string): TemplateRef {
	return `custom:${id}`;
}

export function normalizeTemplateRef(
	value: string | null | undefined,
): TemplateRef {
	if (value === "builtin:sample2") {
		return DEFAULT_TEMPLATE_REF;
	}
	if (value && isTemplateRef(value)) {
		return value;
	}
	return DEFAULT_TEMPLATE_REF;
}
