import { EMAIL_FROM, EMAIL_REPLY_TO, EMAIL_TEMPLATES, TEMPLATE_VARIABLES } from "../lib/email/catalog";
import { buildTemplateHtml } from "../lib/email/html";

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
	throw new Error("RESEND_API_KEY is required");
}

const headers = {
	Authorization: `Bearer ${apiKey}`,
	"Content-Type": "application/json",
	"User-Agent": "yourunique.cv-template-sync/1.0",
	Accept: "application/json",
};

type TemplateRow = {
	id: string;
	name: string;
	alias?: string | null;
};

async function listTemplates() {
	const rows: TemplateRow[] = [];
	let after: string | undefined;
	for (let i = 0; i < 20; i += 1) {
		const url = new URL("https://api.resend.com/templates");
		url.searchParams.set("limit", "100");
		if (after) {
			url.searchParams.set("after", after);
		}
		const response = await fetch(url, { headers });
		const json = (await response.json()) as {
			data?: TemplateRow[];
			has_more?: boolean;
		};
		if (!response.ok) {
			throw new Error(`List templates failed: ${response.status} ${JSON.stringify(json)}`);
		}
		const data = json.data ?? [];
		rows.push(...data);
		if (!json.has_more || data.length === 0) {
			break;
		}
		after = data[data.length - 1]?.id;
	}
	return rows;
}

async function createTemplate(body: Record<string, unknown>) {
	const response = await fetch("https://api.resend.com/templates", {
		method: "POST",
		headers,
		body: JSON.stringify(body),
	});
	const json = (await response.json()) as { id?: string; message?: string };
	if (!response.ok) {
		throw new Error(`Create ${body.alias}: ${response.status} ${JSON.stringify(json)}`);
	}
	return json;
}

async function updateTemplate(idOrAlias: string, body: Record<string, unknown>) {
	const response = await fetch(`https://api.resend.com/templates/${idOrAlias}`, {
		method: "PATCH",
		headers,
		body: JSON.stringify(body),
	});
	const json = await response.json();
	if (!response.ok) {
		throw new Error(`Update ${idOrAlias}: ${response.status} ${JSON.stringify(json)}`);
	}
	return json;
}

async function publishTemplate(idOrAlias: string) {
	const response = await fetch(
		`https://api.resend.com/templates/${idOrAlias}/publish`,
		{ method: "POST", headers },
	);
	const json = await response.json();
	if (!response.ok) {
		throw new Error(`Publish ${idOrAlias}: ${response.status} ${JSON.stringify(json)}`);
	}
	return json;
}

async function main() {
	const existing = await listTemplates();
	const byAlias = new Map(
		existing
			.filter((row) => row.alias)
			.map((row) => [row.alias as string, row]),
	);

	for (const template of EMAIL_TEMPLATES) {
		const html = buildTemplateHtml(template);
		const body = {
			name: template.name,
			alias: template.alias,
			from: EMAIL_FROM,
			reply_to: EMAIL_REPLY_TO,
			subject: template.subject,
			html,
			variables: TEMPLATE_VARIABLES.map((variable) => ({
				key: variable.key,
				type: variable.type,
				fallback_value: variable.fallbackValue,
			})),
		};
		const current = byAlias.get(template.alias);
		if (current) {
			console.log(`update ${template.alias}`);
			await updateTemplate(current.id, body);
			await publishTemplate(current.id);
		} else {
			console.log(`create ${template.alias}`);
			const created = await createTemplate(body);
			const id = created.id ?? template.alias;
			await publishTemplate(id);
		}
	}
	console.log(`synced ${EMAIL_TEMPLATES.length} templates`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
