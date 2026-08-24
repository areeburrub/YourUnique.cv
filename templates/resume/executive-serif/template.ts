export const html = `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>{{name}}</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap" rel="stylesheet" />
	<style>
@page {
	size: A4;
	margin: 0;
}

:root {
	--ink: #1a1a1a;
	--gold: #b08d57;
	--muted: #5a5a5a;
	--fs-name: 26pt;
	--lh-name: 30pt;
	--fs-headline: 10pt;
	--lh-headline: 13pt;
	--fs-section: 10pt;
	--lh-section: 13pt;
	--fs-heading: 11pt;
	--lh-heading: 14pt;
	--fs-body: 9.5pt;
	--lh-body: 13pt;
	--fs-meta: 9pt;
	--lh-meta: 12pt;
	--gap-section: 9pt;
	--gap-title: 6pt;
	--gap-entry: 8pt;
	--gap-role: 4pt;
	--gap-item: 1.5pt;
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
	font-family: "Source Serif 4", "Source Serif Pro", Georgia, "Times New Roman", serif;
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
	text-align: center;
	margin-bottom: 10pt;
}

.name {
	font-family: "Playfair Display", Georgia, serif;
	font-size: var(--fs-name);
	line-height: var(--lh-name);
	font-weight: 700;
	letter-spacing: 0.01em;
}

.rule {
	width: 52pt;
	height: 1.6pt;
	background: var(--gold);
	margin: 7pt auto 6pt;
}

.headline {
	font-size: var(--fs-headline);
	line-height: var(--lh-headline);
	letter-spacing: 0.14em;
	text-transform: uppercase;
	color: var(--muted);
}

.contact {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	align-items: baseline;
	margin-top: 5pt;
	font-size: var(--fs-meta);
	line-height: var(--lh-meta);
	color: var(--muted);
}

.contact > span { display: inline-flex; align-items: baseline; }

.contact > span:not(:last-child)::after {
	content: "·";
	margin: 0 0.42em;
	color: var(--gold);
}

.section { margin-top: var(--gap-section); }

.section-title {
	font-size: var(--fs-section);
	line-height: var(--lh-section);
	font-weight: 600;
	letter-spacing: 0.16em;
	text-transform: uppercase;
	color: var(--ink);
	border-bottom: 0.7pt solid var(--gold);
	padding-bottom: 3pt;
	margin-bottom: var(--gap-title);
}

.summary {
	font-size: var(--fs-body);
	line-height: var(--lh-body);
	text-align: justify;
	text-justify: inter-word;
}

.entry + .entry { margin-top: var(--gap-entry); }
.role + .role { margin-top: var(--gap-role); }

.split {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	gap: 10pt;
}

.title, .school, .project-name {
	font-size: var(--fs-heading);
	line-height: var(--lh-heading);
	font-weight: 600;
}

.company, .degree, .project-stack {
	font-size: var(--fs-meta);
	line-height: var(--lh-meta);
	font-style: italic;
	color: var(--muted);
}

.company a { color: inherit; text-decoration: none; }

.meta {
	flex-shrink: 0;
	font-size: var(--fs-meta);
	line-height: var(--lh-meta);
	color: var(--muted);
}

.bullets, .skill-list {
	list-style: none;
	margin: 2pt 0 0;
	padding: 0 0 0 0.14in;
}

.bullets > li, .skill-list > li {
	position: relative;
	margin-bottom: var(--gap-item);
}

.bullets > li:last-child, .skill-list > li:last-child { margin-bottom: 0; }

.bullets > li::before, .skill-list > li::before {
	content: "•";
	position: absolute;
	left: -0.12in;
	color: var(--gold);
}

.skill-list { margin-top: 0; }
.skill-list > li { margin-bottom: 1.5pt; }

.project + .project { margin-top: 6pt; }
.project-links { font-weight: 400; font-style: normal; }
.edu + .edu { margin-top: 5pt; }

a {
	color: #6b542e;
	text-decoration: none;
}

@media screen {
	body {
		background: #efe8dc;
		padding: 28px 16px;
	}
	.page {
		padding: 15mm 16mm 16mm;
		box-shadow: 0 14px 40px rgba(80, 60, 30, 0.12);
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
			<div class="rule"></div>
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
			<h2 class="section-title">Profile</h2>
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
					<p class="company">
						{{#if ../companyUrl}}
						<a href="{{href ../companyUrl}}">{{../company}}</a>
						{{else}}
						{{../company}}
						{{/if}}{{#if location}} · {{location}}{{/if}}{{#if (employment employment)}} · {{employment employment}}{{/if}}
					</p>
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
			<h2 class="section-title">Expertise</h2>
			<ul class="skill-list">
				{{#each skills}}
				<li><strong>{{category}}:</strong> {{items}}</li>
				{{/each}}
			</ul>
		</section>

		{{#if (gt (len projects) 0)}}
		<section class="section">
			<h2 class="section-title">Selected work</h2>
			{{#each projects}}
			<article class="project">
				<p class="project-name">
					{{name}}{{#if url}} <span class="project-links">(<a href="{{href url}}">{{hostPath url}}</a>)</span>{{/if}}{{#each links}}{{#unless (and ../url (eq label "Website"))}} <span class="project-links">· <a href="{{href url}}">{{label}}</a></span>{{/unless}}{{/each}}
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
					<p class="meta">{{location}}</p>
				</div>
				<div class="split">
					<p class="degree">{{degree}}{{#if gpa}}, {{gpa}}{{/if}}</p>
					<p class="meta">{{dates}}</p>
				</div>
			</article>
			{{/each}}
		</section>
	</main>
</body>
</html>
`;
