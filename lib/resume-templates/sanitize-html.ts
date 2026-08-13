export function sanitizeTemplateHtml(html: string) {
	return html
		.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
		.replace(/<script[\s\S]*?\/>/gi, "")
		.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
		.replace(/javascript:/gi, "")
		.replace(/data:text\/html/gi, "");
}
