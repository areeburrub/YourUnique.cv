import { auth } from "@clerk/nextjs/server";

import { listTemplatesForUser } from "@/lib/resume-templates/registry";

import { TemplatesGallery } from "./_components/templates-gallery";

export default async function TemplatesPage() {
	const { userId } = await auth();
	const result = userId
		? await listTemplatesForUser(userId)
		: { selectedRef: "builtin:classic-serif" as const, templates: [] };

	return (
		<TemplatesGallery
			initialSelectedRef={result.selectedRef}
			initialTemplates={result.templates}
		/>
	);
}
