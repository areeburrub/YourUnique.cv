const MAX_PAGES = 2;
const PDF_SCALE = 2.5;

export type SourcePageImage = {
	filename: string;
	mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
	data: Buffer;
};

export async function rasterizeSourceFile(input: {
	bytes: Buffer;
	mediaType: string;
	filename: string;
}): Promise<SourcePageImage[]> {
	if (input.mediaType.startsWith("image/")) {
		const mediaType = (
			["image/png", "image/jpeg", "image/webp", "image/gif"] as const
		).includes(input.mediaType as SourcePageImage["mediaType"])
			? (input.mediaType as SourcePageImage["mediaType"])
			: "image/png";
		return [
			{
				filename: input.filename,
				mediaType,
				data: input.bytes,
			},
		];
	}

	if (input.mediaType !== "application/pdf") {
		throw new Error(
			`Cannot rasterize source type ${input.mediaType}; upload a PDF or image`,
		);
	}

	const { pdf } = await import("pdf-to-img");
	const document = await pdf(input.bytes, { scale: PDF_SCALE });
	try {
		const pageCount = Math.min(document.length, MAX_PAGES);
		const pages: SourcePageImage[] = [];
		for (let page = 1; page <= pageCount; page++) {
			const data = await document.getPage(page);
			pages.push({
				filename: `${input.filename.replace(/\.pdf$/i, "")}-page-${page}.png`,
				mediaType: "image/png",
				data,
			});
		}
		if (pages.length === 0) {
			throw new Error("PDF has no pages to rasterize");
		}
		return pages;
	} finally {
		await document.destroy();
	}
}
