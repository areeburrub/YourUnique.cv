import { auth } from "@clerk/nextjs/server";

import { getUserContext } from "@/lib/db/contexts";
import { EMPTY_RESUME_STYLE, parseResumeStyle } from "@/lib/resume-style";
import { listTemplatesForUser } from "@/lib/resume-templates/registry";

import { TemplatesGallery } from "./_components/templates-gallery";

export default async function TemplatesPage() {
	const { userId } = await auth();
	const [result, context] = userId
		? await Promise.all([
				listTemplatesForUser(userId),
				getUserContext(userId),
			])
		: [
				{ selectedRef: "builtin:classic-serif" as const, templates: [] },
				null,
			];

	return (
		<TemplatesGallery
			initialSelectedRef={result.selectedRef}
			initialTemplates={result.templates}
			initialStyle={
				context ? parseResumeStyle(context.resumeStyle) : EMPTY_RESUME_STYLE
			}
		/>
	);
}
