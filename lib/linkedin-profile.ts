export function normalizeLinkedInProfileUrl(input: string) {
	const trimmed = input.trim();
	if (!trimmed) {
		return null;
	}
	const withProtocol = /^https?:\/\//i.test(trimmed)
		? trimmed
		: `https://${trimmed}`;
	try {
		const url = new URL(withProtocol);
		const host = url.hostname.replace(/^www\./i, "").toLowerCase();
		if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) {
			return null;
		}
		if (!url.pathname.includes("/in/")) {
			return null;
		}
		url.hash = "";
		url.search = "";
		return url.toString().replace(/\/$/, "");
	} catch {
		return null;
	}
}

export function isLinkedInProfileUrl(input: string) {
	return normalizeLinkedInProfileUrl(input) !== null;
}
