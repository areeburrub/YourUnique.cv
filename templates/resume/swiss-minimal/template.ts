export const html = `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>{{name}}</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet" />
	<style>
@page {
	size: A4;
	margin: 0;
}

:root {
	--ink: #111;
	--muted: #6b7280;
	--rule: #e5e7eb;
	--fs-name: 22pt;
	--lh-name: 26pt;
	--fs-headline: 9.5pt;
	--lh-headline: 12pt;
	--fs-section: 8.5pt;
	--lh-section: 11pt;
	--fs-heading: 10pt;
	--lh-heading: 13pt;
	--fs-body: 9pt;
	--lh-body: 13pt;
	--fs-meta: 8.5pt;
	--lh-meta: 12pt;
	--gap-section: 11pt;
	--gap-title: 8pt;
	--gap-entry: 9pt;
	--gap-role: 5pt;
	--gap-item: 2pt;
}

* { box-sizing: border-box; }

html, body {
	margin: 0;
	padding: 0;
	background: #fff;
	color: var(--ink);
	-webkit-font-smoothing: antialiased;
	print-color-adjust: exact;
	-webkit-print-color-adjust: exact;
}

.page {
	font-family: Inter, "Helvetica Neue", Helvetica, Arial, sans-serif;
	font-size: var(--fs-body);
	line-height: var(--lh-body);
	width: 100%;
	max-width: 210mm;
	min-height: 297mm;
	margin: 0 auto;
	background: #fff;
	padding: 0;
}

.page p, .page li, .page h2, .page h3 {
	margin: 0;
	padding: 0;
}

.header {
	padding-bottom: 10pt;
	border-bottom: 0.6pt solid var(--rule);
	margin-bottom: 2pt;
}

.name {
	font-size: var(--fs-name);
	line-height: var(--lh-name);
	font-weight: 600;
	letter-spacing: -0.03em;
}

.headline {
	font-size: var(--fs-headline);
	line-height: var(--lh-headline);
	letter-spacing: 0.16em;
	text-transform: uppercase;
	color: var(--muted);
	margin-top: 3pt;
}

.contact {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: 0;
	margin-top: 8pt;
	font-size: var(--fs-meta);
	line-height: var(--lh-meta);
	color: var(--muted);
}

.contact > span { display: inline-flex; align-items: baseline; }

.contact > span:not(:last-child)::after {
	content: "·";
	margin: 0 0.45em;
	color: #c4c8d0;
}

.section { margin-top: var(--gap-section); }

.section-title {
	font-size: var(--fs-section);
	line-height: var(--lh-section);
	font-weight: 600;
	letter-spacing: 0.18em;
	text-transform: uppercase;
	color: var(--muted);
	padding-bottom: 4pt;
	border-bottom: 0.5pt solid var(--rule);
	margin-bottom: var(--gap-title);
}

.summary {
	font-size: var(--fs-body);
	line-height: var(--lh-body);
	color: #222;
}

.entry + .entry { margin-top: var(--gap-entry); }
.role + .role { margin-top: var(--gap-role); }

.split {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	gap: 12pt;
}

.title, .school, .project-name {
	font-size: var(--fs-heading);
	line-height: var(--lh-heading);
	font-weight: 600;
	letter-spacing: -0.01em;
}

.company, .degree, .project-stack {
	font-size: var(--fs-meta);
	line-height: var(--lh-meta);
	color: var(--muted);
	font-weight: 400;
}

.company a { color: inherit; text-decoration: none; }

.meta {
	flex-shrink: 0;
	font-size: var(--fs-meta);
	line-height: var(--lh-meta);
	color: var(--muted);
	letter-spacing: 0.02em;
}

.bullets, .skill-list {
	list-style: none;
	margin: 3pt 0 0;
	padding: 0;
}

.bullets > li, .skill-list > li {
	position: relative;
	padding-left: 0.12in;
	margin-bottom: var(--gap-item);
}

.bullets > li:last-child, .skill-list > li:last-child { margin-bottom: 0; }

.bullets > li::before {
	content: "";
	position: absolute;
	left: 0;
	top: 0.38em;
	width: 3.5pt;
	height: 3.5pt;
	border-radius: 50%;
	background: #111;
}

.skill-list { margin-top: 0; }
.skill-list > li {
	padding-left: 0;
	margin-bottom: 3pt;
}
.skill-list > li::before { content: none; }

.project + .project { margin-top: 8pt; }
.project-links { font-weight: 400; color: var(--muted); }
.edu + .edu { margin-top: 6pt; }

a {
	color: inherit;
	text-decoration: none;
}

@media screen {
	body {
		background: #f3f4f6;
		padding: 28px 16px;
	}
	.page {
		padding: 16mm 16mm 18mm;
		box-shadow: 0 14px 40px rgba(15, 23, 42, 0.08);
	}
}

@media print {
	body {
		background: #fff !important;
		padding: 0 !important;
		margin: 0 !important;
	}
	.page {
		box-shadow: none !important;
		margin: 0 !important;
		padding: 0 !important;
		min-height: auto;
		max-width: none;
		width: auto;
	}
}
	</style>
</head>
<body>
	<main class="page">
		<header class="header">
			<p class="name">{{name}}</p>
			{{#if headline}}<p class="headline">{{headline}}</p>{{/if}}
			<p class="contact">
				{{#if location}}<span>{{location}}</span>{{/if}}
				{{#if phone}}<span>{{phone}}</span>{{/if}}
				{{#if email}}<span><a href="mailto:{{email}}">{{email}}</a></span>{{/if}}
				{{#if website}}<span><a href="{{href website}}">{{hostPath website}}</a></span>{{/if}}
				{{#if github}}<span><a href="{{href github}}">{{hostPath github}}</a></span>{{/if}}
				{{#if linkedin}}<span><a href="{{href linkedin}}">{{hostPath linkedin}}</a></span>{{/if}}
			</p>
		</header>

		<section class="section">
			<h2 class="section-title">About</h2>
			<p class="summary">{{summary}}</p>
		</section>

		<section class="section">
			<h2 class="section-title">Experience</h2>
			{{#each experience}}
			<article class="entry">
				{{#each roles}}
				<div class="role">
					<div class="split">
						<p class="title">{{title}}</p>
						<p class="meta">{{dates}}</p>
					</div>
					<div class="split">
						<p class="company">
							{{#if ../companyUrl}}
							<a href="{{href ../companyUrl}}">{{../company}}</a>
							{{else}}
							{{../company}}
							{{/if}}{{#if location}} · {{location}}{{/if}}{{#if (employment employment)}} · {{employment employment}}{{/if}}
						</p>
					</div>
					<ul class="bullets">
						{{#each bullets}}
						<li>{{#if label}}<strong>{{label}}:</strong> {{/if}}{{text}}</li>
						{{/each}}
					</ul>
				</div>
				{{/each}}
			</article>
			{{/each}}
		</section>

		<section class="section">
			<h2 class="section-title">Skills</h2>
			<ul class="skill-list">
				{{#each skills}}
				<li><strong>{{category}}</strong> — {{items}}</li>
				{{/each}}
			</ul>
		</section>

		{{#if (gt (len projects) 0)}}
		<section class="section">
			<h2 class="section-title">Selected work</h2>
			{{#each projects}}
			<article class="project">
				<p class="project-name">
					{{name}}{{#if url}} <span class="project-links"><a href="{{href url}}">{{hostPath url}}</a></span>{{/if}}{{#each links}}{{#unless (and ../url (eq label "Website"))}} <span class="project-links">· <a href="{{href url}}">{{label}}</a></span>{{/unless}}{{/each}}
				</p>
				{{#if stack}}<p class="project-stack">{{stack}}</p>{{/if}}
				<ul class="bullets">
					{{#each bullets}}
					<li>{{#if label}}<strong>{{label}}:</strong> {{/if}}{{text}}</li>
					{{/each}}
				</ul>
			</article>
			{{/each}}
		</section>
		{{/if}}

		<section class="section">
			<h2 class="section-title">Education</h2>
			{{#each education}}
			<article class="edu">
				<div class="split">
					<p class="school">{{school}}</p>
					<p class="meta">{{dates}}</p>
				</div>
				<p class="degree">{{degree}}{{#if location}} · {{location}}{{/if}}</p>
			</article>
			{{/each}}
		</section>
	</main>
</body>
</html>
`;
