export function dodoEnvironment(): "test_mode" | "live_mode" {
	return process.env.NODE_ENV === "production" ? "live_mode" : "test_mode";
}

export function dodoReturnUrl() {
	if (process.env.DODO_PAYMENTS_RETURN_URL) {
		return process.env.DODO_PAYMENTS_RETURN_URL;
	}

	const host =
		process.env.VERCEL_PROJECT_PRODUCTION_URL ||
		process.env.VERCEL_URL ||
		null;

	if (host) {
		return `https://${host.replace(/^https?:\/\//, "")}/new-chat`;
	}

	return "http://localhost:6700/new-chat";
}
