export const html = `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>{{name}}</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet" />
	<style>
@page {
	size: A4;
	margin: 0;
}

:root {
	--ink: #111;
	--muted: #333;
	--fs-name: 24pt;
	--lh-name: 26pt;
	--fs-section: 10.5pt;
	--lh-section: 12pt;
	--fs-heading: 10.5pt;
	--lh-heading: 12.5pt;
	--fs-body: 9.5pt;
	--lh-body: 12pt;
	--fs-meta: 9.5pt;
	--lh-meta: 12pt;
	--gap-section: 7pt;
	--gap-title: 4pt;
	--gap-entry: 6pt;
	--gap-role: 3pt;
	--gap-item: 1pt;
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
	font-family: "Source Sans 3", "Source Sans Pro", "Helvetica Neue", Arial, sans-serif;
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
	margin-bottom: 8pt;
}

.name {
	font-size: var(--fs-name);
	line-height: var(--lh-name);
	font-weight: 700;
	font-variant: small-caps;
	letter-spacing: 0.04em;
	margin-bottom: 3pt;
}

.contact {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	align-items: baseline;
	font-size: var(--fs-meta);
	line-height: var(--lh-meta);
}

.contact > span {
	display: inline-flex;
	align-items: baseline;
}

.contact > span:not(:last-child)::after {
	content: "|";
	margin: 0 0.38em;
	color: #666;
	font-weight: 400;
}

.section { margin-top: var(--gap-section); }

.section-title {
	font-size: var(--fs-section);
	line-height: var(--lh-section);
	font-weight: 700;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	border-bottom: 0.8pt solid #000;
	padding-bottom: 2pt;
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

.degree {
	font-size: var(--fs-body);
	line-height: var(--lh-body);
	font-style: italic;
}

.meta {
	flex-shrink: 0;
	font-size: var(--fs-meta);
	line-height: var(--lh-meta);
	font-style: italic;
}

.employment {
	font-size: var(--fs-meta);
	line-height: var(--lh-meta);
	font-style: italic;
	color: var(--muted);
}

.bullets, .skill-list {
	list-style: none;
	margin: 1.5pt 0 0;
	padding: 0 0 0 0.14in;
}

.bullets > li, .skill-list > li {
	position: relative;
	margin-bottom: var(--gap-item);
	padding-left: 0.02in;
}

.bullets > li:last-child, .skill-list > li:last-child { margin-bottom: 0; }

.bullets > li::before, .skill-list > li::before {
	content: "•";
	position: absolute;
	left: -0.12in;
}

.skill-list { margin-top: 0; }
.skill-list > li { margin-bottom: 1pt; }

.project + .project { margin-top: var(--gap-role); }

.project-links { font-weight: 400; font-style: italic; }

.edu + .edu { margin-top: var(--gap-role); }

a {
	color: inherit;
	text-decoration: none;
}

@media screen {
	body {
		background: #ececec;
		padding: 28px 16px;
	}
	.page {
		padding: 12mm 14mm 14mm;
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
			<h2 class="section-title">Summary</h2>
			<p class="summary">{{summary}}</p>
		</section>

		<section class="section">
			<h2 class="section-title">Experience</h2>
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
						<p class="title">{{title}}{{#if (employment employment)}} <span class="employment">· {{employment employment}}</span>{{/if}}</p>
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
			<h2 class="section-title">Technical Skills</h2>
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
					{{name}}{{#if stack}} <span class="project-links">| {{stack}}</span>{{/if}}{{#if url}} <span class="project-links">| <a href="{{href url}}">{{hostPath url}}</a></span>{{/if}}{{#each links}}{{#unless (and ../url (eq label "Website"))}} <span class="project-links">| <a href="{{href url}}">{{label}}</a></span>{{/unless}}{{/each}}
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
					<p class="degree">{{degree}}</p>
					<p class="meta">{{dates}}</p>
				</div>
			</article>
			{{/each}}
		</section>
	</main>
</body>
</html>
`;
