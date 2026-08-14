import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "playwright";

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
			const pdfBuffer = await page.pdf({
				format: "A4",
				printBackground: true,
				preferCSSPageSize: true,
				margin: {
					top: "0",
					right: "0",
					bottom: "0",
					left: "0",
				},
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

export async function compileHtmlToPng(html: string) {
	const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-preview-"));
	const htmlPath = path.join(workDir, "resume.html");

	try {
		await fs.writeFile(htmlPath, html, "utf8");
		const browser = await chromium.launch({ headless: true });
		try {
			const page = await browser.newPage({
				viewport: { width: 794, height: 1123 },
				deviceScaleFactor: 2,
			});
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
					html, body {
						margin: 0 !important;
						padding: 0 !important;
						background: #ffffff !important;
					}
					.page, main.page, main {
						margin: 0 !important;
						box-shadow: none !important;
						max-width: none !important;
						width: 210mm !important;
						min-height: 297mm !important;
					}
				`,
			});

			const target =
				(await page.$(".page")) ??
				(await page.$("main")) ??
				(await page.$("body"));
			const png = target
				? await target.screenshot({ type: "png" })
				: await page.screenshot({ type: "png", fullPage: true });
			await page.close();
			return Buffer.from(png);
		} finally {
			await browser.close();
		}
	} finally {
		await fs.rm(workDir, { recursive: true, force: true }).catch(() => undefined);
	}
}
