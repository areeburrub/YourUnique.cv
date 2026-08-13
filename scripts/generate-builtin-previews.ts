import { mkdir, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";

import { compileHtmlToPdf } from "@/lib/resume-compile";
import { compileHtmlToPng } from "@/lib/resume-templates/html-to-image";
import { renderHandlebarsHtml } from "@/lib/resume-templates/handlebars";
import { builtinTemplateSources } from "@/templates/resume";

async function main() {
	for (const source of builtinTemplateSources) {
		const rendered = renderHandlebarsHtml(source.html, source.sampleData);
		const [png, pdf] = await Promise.all([
			compileHtmlToPng(rendered),
			compileHtmlToPdf(rendered),
		]);

		const folder = path.join(process.cwd(), "templates/resume", source.folder);
		const publicDir = path.join(
			process.cwd(),
			"public/templates/builtins",
			source.id,
		);
		await mkdir(publicDir, { recursive: true });

		const sourcePng = path.join(folder, "preview.png");
		const sourcePdf = path.join(folder, "preview.pdf");
		await writeFile(sourcePng, png);
		await writeFile(sourcePdf, pdf);

		const publicPng = path.join(publicDir, "preview.png");
		const publicPdf = path.join(publicDir, "preview.pdf");
		await copyFile(sourcePng, publicPng);
		await copyFile(sourcePdf, publicPdf);

		console.log(
			`Wrote ${source.id}: png ${png.byteLength}b, pdf ${pdf.byteLength}b`,
		);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
