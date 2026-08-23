import { deflateSync } from "node:zlib";
import { describe, expect, test } from "bun:test";

import { extractPdfLinks, formatPdfLinksForModel } from "@/lib/pdf-links";

describe("extractPdfLinks", () => {
	test("reads clickable /URI annotations that are not printed as text", () => {
		const pdf = Buffer.from(
			"%PDF-1.4\n/URI (https://github.com/areeburrub)\n/URI (https://www.linkedin.com/in/areeburrub/)\n",
			"latin1",
		);
		expect(extractPdfLinks(pdf)).toEqual([
			{ label: "GitHub", url: "https://github.com/areeburrub" },
			{ label: "LinkedIn", url: "https://www.linkedin.com/in/areeburrub" },
		]);
	});

	test("reads /URI values hidden inside FlateDecode streams", () => {
		const inner = Buffer.from(
			"<< /A << /S /URI /URI (https://areeburrub.dev) >> >>",
			"utf8",
		);
		const compressed = deflateSync(inner);
		const pdf = Buffer.from(
			`%PDF-1.4\nstream\n${compressed.toString("latin1")}\nendstream\n`,
			"latin1",
		);
		expect(extractPdfLinks(pdf)).toEqual([
			{ label: "Website", url: "https://areeburrub.dev" },
		]);
	});

	test("decodes hex /URI strings and skips PDF infrastructure hosts", () => {
		const githubHex = Buffer.from("https://github.com/areeburrub/ledger").toString(
			"hex",
		);
		const pdf = Buffer.from(
			`%PDF-1.4\n/URI <${githubHex}>\n/URI (https://www.adobe.com/go/acrobat)\n`,
			"latin1",
		);
		expect(extractPdfLinks(pdf)).toEqual([
			{ label: "GitHub", url: "https://github.com/areeburrub/ledger" },
		]);
	});

	test("formats extracted links as markdown for the model", () => {
		expect(
			formatPdfLinksForModel(
				[{ label: "GitHub", url: "https://github.com/areeburrub" }],
				"Areeb.pdf",
			),
		).toContain("- [GitHub](https://github.com/areeburrub)");
	});
});
