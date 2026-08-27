import { createRequire } from "node:module";
import path from "node:path";

import { extractPdfLinks, formatPdfLinksForModel } from "@/lib/pdf-links";
import {
	RESUME_CHAR_LIMIT,
	TOOL_PDF_MAX_PAGES,
	TOOL_PDF_MIN_TEXT,
} from "@/lib/tools/constants";

function clip(text: string, max: number) {
	const trimmed = text.trim();
	if (trimmed.length <= max) {
		return trimmed;
	}
	return `${trimmed.slice(0, max)}\n[truncated]`;
}

export type ScannedResume =
	| { kind: "text"; text: string }
	| {
			kind: "file";
			filename: string;
			bytes: Uint8Array;
			links: string;
	  };

async function extractPdfPageText(bytes: Uint8Array) {
	const require = createRequire(import.meta.url);
	const pdfjsPath = path.dirname(require.resolve("pdfjs-dist/package.json"));
	const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

	const document = await pdfjs.getDocument({
		data: new Uint8Array(bytes),
		isEvalSupported: false,
		cMapPacked: true,
		cMapUrl: `${path.join(pdfjsPath, "cmaps")}${path.sep}`,
		standardFontDataUrl: `${path.join(pdfjsPath, "standard_fonts")}${path.sep}`,
	}).promise;

	try {
		const pageCount = Math.min(document.numPages, TOOL_PDF_MAX_PAGES);
		const pages: string[] = [];
		for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
			const page = await document.getPage(pageNumber);
			const content = await page.getTextContent();
			const line = content.items
				.map((item) => ("str" in item ? item.str : ""))
				.join(" ")
				.replace(/\s+/g, " ")
				.trim();
			if (line) {
				pages.push(line);
			}
		}
		return pages.join("\n");
	} finally {
		await document.destroy();
	}
}

export async function scanResumePdf(input: {
	filename: string;
	bytes: Uint8Array;
}): Promise<ScannedResume> {
	let extracted = "";
	try {
		extracted = await extractPdfPageText(input.bytes);
	} catch (error) {
		console.error("pdf text extract failed", error);
	}

	const links = formatPdfLinksForModel(
		extractPdfLinks(input.bytes),
		input.filename,
	);
	const text = clip(
		[extracted, links].filter(Boolean).join("\n\n"),
		RESUME_CHAR_LIMIT,
	);

	if (text.replace(/\s+/g, "").length >= TOOL_PDF_MIN_TEXT) {
		return { kind: "text", text };
	}

	return {
		kind: "file",
		filename: input.filename,
		bytes: input.bytes,
		links,
	};
}
