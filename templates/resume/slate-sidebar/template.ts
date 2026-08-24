export const html = `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>{{name}}</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />
	<style>
@page {
	size: A4;
	margin: 0;
}

:root {
	--rail: #1e293b;
	--rail-ink: #f8fafc;
	--rail-muted: #94a3b8;
	--ink: #0f172a;
	--muted: #64748b;
	--accent: #38bdf8;
	--fs-name: 15pt;
	--lh-name: 18pt;
	--fs-section: 8pt;
	--lh-section: 10pt;
	--fs-heading: 9.5pt;
	--lh-heading: 12pt;
	--fs-body: 8.25pt;
	--lh-body: 11pt;
	--fs-meta: 7.75pt;
	--lh-meta: 10.5pt;
	--gap-section: 7pt;
	--gap-title: 4pt;
	--gap-entry: 5pt;
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
	font-family: Inter, "Helvetica Neue", Arial, sans-serif;
	font-size: var(--fs-body);
	line-height: var(--lh-body);
	width: 100%;
	max-width: 210mm;
	min-height: 297mm;
	margin: 0 auto;
	background: #fff;
	display: grid;
	grid-template-columns: 62mm 1fr;
	padding: 0;
}

.page p, .page li, .page h2, .page h3 {
	margin: 0;
	padding: 0;
}

.sidebar {
	background: var(--rail);
	color: var(--rail-ink);
	padding: 13mm 9mm 12mm 10mm;
}

.main {
	padding: 12mm 10mm 11mm 10mm;
}

.sidebar .name {
	font-size: var(--fs-name);
	line-height: var(--lh-name);
	font-weight: 700;
	letter-spacing: -0.02em;
}

.sidebar .headline {
	font-size: var(--fs-meta);
	line-height: var(--lh-meta);
	color: var(--accent);
	letter-spacing: 0.08em;
	text-transform: uppercase;
	margin-top: 4pt;
	font-weight: 600;
}

.rail-block { margin-top: 12pt; }

.rail-title {
	font-size: 7.5pt;
	line-height: 10pt;
	font-weight: 700;
	letter-spacing: 0.16em;
	text-transform: uppercase;
	color: var(--rail-muted);
	border-bottom: 0.6pt solid rgba(148, 163, 184, 0.35);
	padding-bottom: 3pt;
	margin-bottom: 7pt;
}

.rail-list {
	list-style: none;
	margin: 0;
	padding: 0;
}

.rail-list > li {
	font-size: var(--fs-meta);
	line-height: 13pt;
	margin-bottom: 4pt;
	word-break: break-word;
}

.rail-list a {
	color: var(--rail-ink);
	text-decoration: none;
}

.skill-group + .skill-group { margin-top: 6pt; }

.skill-cat {
	font-size: 8pt;
	line-height: 11pt;
	font-weight: 700;
	color: var(--accent);
	margin-bottom: 1pt;
}

.skill-items {
	font-size: var(--fs-meta);
	line-height: 12pt;
	color: #e2e8f0;
}

.section + .section { margin-top: var(--gap-section); }

.section-title {
	font-size: var(--fs-section);
	line-height: var(--lh-section);
	font-weight: 700;
	letter-spacing: 0.14em;
	text-transform: uppercase;
	color: var(--rail);
	border-bottom: 1.2pt solid var(--rail);
	padding-bottom: 3pt;
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
	gap: 8pt;
}

.company, .title, .school, .project-name {
	font-size: var(--fs-heading);
	line-height: var(--lh-heading);
	font-weight: 700;
}

.company a { color: inherit; text-decoration: none; }

.meta, .employment, .project-stack, .degree {
	font-size: var(--fs-meta);
	line-height: var(--lh-meta);
	color: var(--muted);
}

.meta { flex-shrink: 0; }

.bullets {
	list-style: none;
	margin: 2pt 0 0;
	padding: 0 0 0 0.12in;
}

.bullets > li {
	position: relative;
	margin-bottom: var(--gap-item);
}

.bullets > li:last-child { margin-bottom: 0; }

.bullets > li::before {
	content: "•";
	position: absolute;
	left: -0.11in;
	color: var(--rail);
}

.project + .project { margin-top: 4pt; }
.project-links { font-weight: 400; }
.edu + .edu { margin-top: 5pt; }

.main a {
	color: #0f4c81;
	text-decoration: none;
}

@media screen {
	body {
		background: #e2e8f0;
		padding: 28px 16px;
	}
	.page {
		box-shadow: 0 14px 40px rgba(15, 23, 42, 0.16);
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
		min-height: calc(297mm - 24mm);
		max-width: none;
		width: auto;
	}
}
	</style>
</head>
<body>
	<main class="page">
		<aside class="sidebar">
			<p class="name">{{name}}</p>
			{{#if headline}}<p class="headline">{{headline}}</p>{{/if}}

			<div class="rail-block">
				<h2 class="rail-title">Contact</h2>
				<ul class="rail-list">
					{{#if location}}<li>{{location}}</li>{{/if}}
					{{#if phone}}<li>{{phone}}</li>{{/if}}
					{{#if email}}<li><a href="mailto:{{email}}">{{email}}</a></li>{{/if}}
					{{#if website}}<li><a href="{{href website}}">{{hostPath website}}</a></li>{{/if}}
					{{#if github}}<li><a href="{{href github}}">{{hostPath github}}</a></li>{{/if}}
					{{#if linkedin}}<li><a href="{{href linkedin}}">{{hostPath linkedin}}</a></li>{{/if}}
				</ul>
			</div>

			<div class="rail-block">
				<h2 class="rail-title">Skills</h2>
				{{#each skills}}
				<div class="skill-group">
					<p class="skill-cat">{{category}}</p>
					<p class="skill-items">{{items}}</p>
				</div>
				{{/each}}
			</div>
		</aside>

		<div class="main">
			<section class="section">
				<h2 class="section-title">Profile</h2>
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
							<p class="title">{{title}}</p>
							<p class="meta">{{dates}}</p>
						</div>
						{{#if (employment employment)}}
						<p class="employment">{{employment employment}}</p>
						{{/if}}
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

			{{#if (gt (len projects) 0)}}
			<section class="section">
				<h2 class="section-title">Projects</h2>
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
		</div>
	</main>
</body>
</html>
`;
