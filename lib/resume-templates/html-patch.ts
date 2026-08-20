export type TemplateHtmlPatch = {
	find: string;
	replace: string;
};

function countOccurrences(haystack: string, needle: string): number {
	if (!needle) {
		return 0;
	}
	let count = 0;
	let fromIndex = 0;
	while (true) {
		const index = haystack.indexOf(needle, fromIndex);
		if (index === -1) {
			break;
		}
		count += 1;
		fromIndex = index + needle.length;
	}
	return count;
}

// Exact-match find/replace, like a text editor's "replace" — not a regex and
// not string.replace's special $-pattern handling. `find` must match exactly
// once so a vague snippet fails loudly instead of touching the wrong spot.
export function applyTemplateHtmlPatches(
	html: string,
	patches: TemplateHtmlPatch[],
): string {
	let next = html;
	patches.forEach((patch, index) => {
		const label = `Patch ${index + 1}`;
		if (!patch.find) {
			throw new Error(`${label}: find must not be empty`);
		}
		const occurrences = countOccurrences(next, patch.find);
		if (occurrences === 0) {
			throw new Error(
				`${label}: find text was not found in the template HTML. Re-check exact whitespace/quotes/casing, or fetch the source again.`,
			);
		}
		if (occurrences > 1) {
			throw new Error(
				`${label}: find text matches ${occurrences} places in the template HTML. Include more surrounding context so it matches exactly once.`,
			);
		}
		const at = next.indexOf(patch.find);
		next = next.slice(0, at) + patch.replace + next.slice(at + patch.find.length);
	});
	return next;
}
