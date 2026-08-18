import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "playwright";

import { rasterizePdfFirstPage } from "@/lib/resume-templates/rasterize-source";

export const PRINT_PAGE_MARGIN = "12mm";

export async function compileHtmlToPdf(html: string) {
	const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-compile-"));
	const htmlPath = path.join(workDir, "resume.html");

	try {
		await fs.writeFile(htmlPath, html, "utf8");

		const browser = await chromium.launch({
			headless: true,
		});
		try {
			const page = await browser.newPage();
			await page.goto(pathToFileURL(htmlPath).href, {
				waitUntil: "networkidle",
				timeout: 120_000,
			});
			await page.evaluate(async () => {
				if (document.fonts?.ready) {
					await document.fonts.ready;
				}
			});
			await page.addStyleTag({
				content: `
					@page {
						size: A4 !important;
						margin: ${PRINT_PAGE_MARGIN} !important;
					}
					html, body {
						margin: 0 !important;
						padding: 0 !important;
						background: #fff !important;
					}
					.page, main.page, main {
						box-sizing: border-box !important;
						width: auto !important;
						max-width: 100% !important;
						margin: 0 !important;
						box-shadow: none !important;
					}
				`,
			});
			const pdfBuffer = await page.pdf({
				format: "A4",
				printBackground: true,
				preferCSSPageSize: true,
			});
			await page.close();
			return Buffer.from(pdfBuffer);
		} finally {
			await browser.close();
		}
	} catch (error) {
		const message =
			error instanceof Error ? error.message.slice(0, 1500) : "PDF failed";
		throw new Error(`HTML to PDF compile failed: ${message}`);
	} finally {
		await fs.rm(workDir, { recursive: true, force: true }).catch(() => undefined);
	}
}

export async function compileHtmlToPdfAndPng(html: string) {
	const pdf = await compileHtmlToPdf(html);
	const png = await rasterizePdfFirstPage(pdf);
	return { pdf, png };
}

export async function compileHtmlToPng(html: string) {
	const { png } = await compileHtmlToPdfAndPng(html);
	return png;
}
