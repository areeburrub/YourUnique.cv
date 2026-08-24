export const html = `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>{{name}}</title>
	<style>
@page {
	size: A4;
	margin: 0;
}

:root {
	--ink: #000;
	--link: #1f4e79;
	--fs-name: 18pt;
	--lh-name: 22pt;
	--fs-headline: 11pt;
	--lh-headline: 14pt;
	--fs-section: 11pt;
	--lh-section: 14pt;
	--fs-heading: 11pt;
	--lh-heading: 14pt;
	--fs-body: 10.5pt;
	--lh-body: 13.5pt;
	--fs-meta: 10.5pt;
	--lh-meta: 13.5pt;
	--gap-section: 8pt;
	--gap-title: 4pt;
	--gap-entry: 7pt;
	--gap-role: 3pt;
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
	font-family: Calibri, Carlito, "Segoe UI", Arial, sans-serif;
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

.header { margin-bottom: 8pt; }

.name {
	font-size: var(--fs-name);
	line-height: var(--lh-name);
	font-weight: 700;
}

.headline {
	font-size: var(--fs-headline);
	line-height: var(--lh-headline);
	font-weight: 700;
	margin-top: 1pt;
}

.contact {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	font-size: var(--fs-meta);
	line-height: var(--lh-meta);
	margin-top: 3pt;
}

.contact > span { display: inline-flex; align-items: baseline; }

.contact > span:not(:last-child)::after {
	content: " | ";
	white-space: pre;
	color: #000;
}

.section { margin-top: var(--gap-section); }

.section-title {
	font-size: var(--fs-section);
	line-height: var(--lh-section);
	font-weight: 700;
	text-transform: uppercase;
	border-bottom: 1pt solid #000;
	padding-bottom: 1pt;
	margin-bottom: var(--gap-title);
}

.summary {
	font-size: var(--fs-body);
	line-height: var(--lh-body);
}

.entry + .entry { margin-top: var(--gap-entry); }
.role + .role { margin-top: var(--gap-role); }

.split {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	gap: 10pt;
}

.company, .title, .school, .project-name {
	font-size: var(--fs-heading);
	line-height: var(--lh-heading);
	font-weight: 700;
}

.company a { color: inherit; text-decoration: none; }

.degree, .employment {
	font-size: var(--fs-body);
	line-height: var(--lh-body);
}

.meta {
	flex-shrink: 0;
	font-size: var(--fs-meta);
	line-height: var(--lh-meta);
}

.bullets, .skill-list {
	list-style: none;
	margin: 2pt 0 0;
	padding: 0 0 0 0.18in;
}

.bullets > li, .skill-list > li {
	position: relative;
	margin-bottom: var(--gap-item);
}

.bullets > li:last-child, .skill-list > li:last-child { margin-bottom: 0; }

.bullets > li::before, .skill-list > li::before {
	content: "•";
	position: absolute;
	left: -0.14in;
}

.skill-list { margin-top: 0; }
.skill-list > li { margin-bottom: 1pt; }

.project + .project { margin-top: var(--gap-role); }
.project-links { font-weight: 400; }
.edu + .edu { margin-top: var(--gap-role); }

a {
	color: var(--link);
	text-decoration: none;
}

@media screen {
	body {
		background: #e8e8e8;
		padding: 28px 16px;
	}
	.page {
		padding: 14mm 16mm 16mm;
		box-shadow: 0 14px 40px rgba(15, 23, 42, 0.12);
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
			<h2 class="section-title">Professional Summary</h2>
			<p class="summary">{{summary}}</p>
		</section>

		<section class="section">
			<h2 class="section-title">Work Experience</h2>
			{{#each experience}}
			<article class="entry">
				{{#each roles}}
				{{#if @first}}
				<div class="split">
					<h3 class="company">
						{{#if ../companyUrl}}
						<a href="{{href ../companyUrl}}">{{../company}}</a>
						{{else}}
						{{../company}}
						{{/if}}
					</h3>
					<p class="meta">{{location}}</p>
				</div>
				{{/if}}
				<div class="role">
					<div class="split">
						<p class="title">{{title}}{{#if (employment employment)}}, {{employment employment}}{{/if}}</p>
						<p class="meta">{{dates}}</p>
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
				<li><strong>{{category}}:</strong> {{items}}</li>
				{{/each}}
			</ul>
		</section>

		{{#if (gt (len projects) 0)}}
		<section class="section">
			<h2 class="section-title">Projects</h2>
			{{#each projects}}
			<article class="project">
				<p class="project-name">
					{{name}}{{#if stack}} — {{stack}}{{/if}}{{#if url}} (<a href="{{href url}}">{{hostPath url}}</a>){{/if}}{{#each links}}{{#unless (and ../url (eq label "Website"))}} · <a href="{{href url}}">{{label}}</a>{{/unless}}{{/each}}
				</p>
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
