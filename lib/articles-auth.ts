import { timingSafeEqual } from "node:crypto";

function readProvidedKey(request: Request) {
	const header = request.headers.get("authorization");
	if (header?.startsWith("Bearer ")) {
		return header.slice(7).trim();
	}
	return request.headers.get("x-articles-key")?.trim() ?? "";
}

export function authorizeArticlesRequest(request: Request) {
	const expected = process.env.ARTICLES_API_KEY?.trim();
	if (!expected) {
		return false;
	}

	const provided = readProvidedKey(request);
	if (!provided) {
		return false;
	}

	const expectedBuffer = Buffer.from(expected);
	const providedBuffer = Buffer.from(provided);
	if (expectedBuffer.length !== providedBuffer.length) {
		return false;
	}

	return timingSafeEqual(expectedBuffer, providedBuffer);
}

export function unauthorizedArticlesResponse() {
	return Response.json({ error: "Unauthorized" }, { status: 401 });
}
