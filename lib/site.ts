export const SITE_NAME = "YourUnique.cv";
export const SITE_SHORT_NAME = "YourUnique";
export const SITE_TAGLINE = "Resumes that match the job";
export const SITE_DESCRIPTION =
	"Chat with an agent that knows your career story. Paste a job description, get a tailored professional resume PDF.";
export const SITE_EMAIL = "contact@areeburrub.dev";

export function getSiteUrl() {
	const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
	if (explicit && !/localhost|127\.0\.0\.1/.test(explicit)) {
		return explicit;
	}
	if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
		return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
	}
	return "https://yourunique.cv";
}
