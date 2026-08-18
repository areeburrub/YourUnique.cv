export const html = `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>{{name}}</title>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/aaaakshat/cm-web-fonts@master/fonts.css" />
	<style>
@page {
	size: A4;
	margin: 0;
}

:root {
	--fs-name: 16pt;
	--lh-name: 18pt;
	--fs-section: 10pt;
	--lh-section: 12pt;
	--fs-heading: 10pt;
	--lh-heading: 12pt;
	--fs-body: 9pt;
	--lh-body: 11pt;
	--fs-meta: 9pt;
	--lh-meta: 11pt;
	--gap-section: 4pt;
	--gap-title: 7pt;
	--gap-entry: 4pt;
	--gap-item: 1.25pt;
}

* {
	box-sizing: border-box;
}

body {
	margin: 0;
	background: #e5e5e5;
	color: #000;
	-webkit-font-smoothing: antialiased;
	print-color-adjust: exact;
	-webkit-print-color-adjust: exact;
}

.page {
	font-family: "Computer Modern Serif", "CMU Serif", "Latin Modern Roman", "Liberation Serif", "Times New Roman", serif;
	font-size: var(--fs-body);
	line-height: var(--lh-body);
	margin: 24px auto;
	min-height: 297mm;
	width: 100%;
	max-width: 210mm;
	background: #fff;
	padding: 0.45in 0.5in 0.4in;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
}

.page p,
.page li,
.page h2,
.page h3 {
	margin: 0;
	padding: 0;
}

.section {
	margin-top: var(--gap-section);
}

.section-title {
	font-size: var(--fs-section);
	line-height: var(--lh-section);
	font-weight: normal;
	font-variant: small-caps;
	letter-spacing: 0.03em;
	border-bottom: 0.6pt solid black;
	padding-bottom: 5pt;
	margin-bottom: var(--gap-title);
}

.section-body,
.skill-list > li,
.project-list > li,
.sub-list > li {
	font-size: var(--fs-body);
	line-height: var(--lh-body);
	text-align: justify;
	text-justify: inter-word;
	hyphens: auto;
}

.company {
	font-size: var(--fs-heading);
	line-height: var(--lh-heading);
	font-weight: bold;
	margin-top: 2pt;
	margin-bottom: 1pt;
}

.role-list,
.skill-list,
.project-list {
	list-style: none;
	margin: 0;
	padding: 0;
	padding-left: 0.15in;
}

.role-list > li {
	position: relative;
	margin-bottom: var(--gap-entry);
}

.role-list > li::before,
.skill-list > li::before,
.project-list > li::before,
.sub-list > li::before {
	font-size: var(--fs-body);
	line-height: var(--lh-body);
}

.role-list > li::before,
.skill-list > li::before,
.project-list > li::before {
	content: "•";
	position: absolute;
	left: -0.12in;
}

.skill-list > li,
.project-list > li {
	position: relative;
	margin-bottom: var(--gap-item);
	padding-left: 0.02in;
}

.role-list {
	margin-top: 2pt;
}

.skill-list,
.project-list {
	margin-top: 1pt;
}

.role-title-row {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	gap: 8pt;
	font-size: var(--fs-heading);
	line-height: var(--lh-heading);
}

.role-meta-row {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	gap: 8pt;
	font-size: var(--fs-meta);
	line-height: var(--lh-meta);
	font-style: italic;
	margin-bottom: 1pt;
}

.sub-list {
	list-style: none;
	margin: 2pt 0 0;
	padding: 0 0 0 0.2in;
}

.sub-list > li {
	position: relative;
	margin-bottom: var(--gap-item);
}

.sub-list > li::before {
	content: "◦";
	position: absolute;
	left: -0.15in;
}

.header-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	column-gap: 8pt;
	row-gap: 1pt;
	margin-bottom: 2pt;
	font-size: var(--fs-meta);
	line-height: var(--lh-meta);
}

.text-name {
	font-size: var(--fs-name);
	line-height: var(--lh-name);
	font-weight: bold;
}

.text-right {
	text-align: right;
}

.text-small {
	font-size: var(--fs-meta);
	line-height: var(--lh-meta);
}

.shrink-0 {
	flex-shrink: 0;
}

.font-bold {
	font-weight: bold;
}

.edu-row {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	gap: 8pt;
	font-size: var(--fs-heading);
	line-height: var(--lh-heading);
}

.edu-row + .edu-row {
	font-size: var(--fs-body);
	line-height: var(--lh-body);
	font-style: italic;
}

a {
	color: #000080;
	text-decoration: none;
}

@media print {
	body {
		background: white !important;
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
		<header class="header-grid">
			<p class="text-name font-bold">{{name}}</p>
			{{#if email}}
			<p class="text-right"><a href="mailto:{{email}}">{{email}}</a></p>
			{{else}}
			<p></p>
			{{/if}}
			{{#if website}}
			<p><a href="{{href website}}">{{hostPath website}}</a></p>
			{{else}}
			<p></p>
			{{/if}}
			{{#if phone}}
			<p class="text-right">{{phone}}</p>
			{{else}}
			<p></p>
			{{/if}}
			{{#if github}}
			<p><a href="{{href github}}">{{hostPath github}}</a></p>
			{{else}}
			<p></p>
			{{/if}}
			{{#if linkedin}}
			<p class="text-right"><a href="{{href linkedin}}">{{hostPath linkedin}}</a></p>
			{{else}}
			<p></p>
			{{/if}}
		</header>

		<section class="section">
			<h2 class="section-title">Summary</h2>
			<p class="section-body">{{summary}}</p>
		</section>

		<section class="section">
			<h2 class="section-title">Work Experience</h2>
			{{#each experience}}
			<div>
				<h3 class="company">
					{{#if companyUrl}}
					<a href="{{href companyUrl}}">{{company}}</a>
					{{else}}
					{{company}}
					{{/if}}
				</h3>
				<ul class="role-list">
					{{#each roles}}
					<li>
						<div class="role-title-row">
							<p class="font-bold">{{title}}</p>
							<p class="shrink-0 text-small">{{location}}</p>
						</div>
						{{#if (or (employment employment) startDate endDate)}}
						<div class="role-meta-row">
							<p>{{#if (employment employment)}}{{employment employment}}{{else}}&nbsp;{{/if}}</p>
							<p class="shrink-0">{{dateRange startDate endDate}}</p>
						</div>
						{{/if}}
						<ul class="sub-list">
							{{#each bullets}}
							<li>
								{{#if label}}<strong>{{label}}:</strong> {{/if}}{{text}}
							</li>
							{{/each}}
						</ul>
					</li>
					{{/each}}
				</ul>
			</div>
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
			<ul class="project-list">
				{{#each projects}}
				<li>
					<strong>{{name}}:</strong> {{projectBody this}}{{#if (or (gt (len links) 0) url)}} Links: {{#each links}}{{#unless @first}}, {{/unless}}<a href="{{href url}}">{{label}}</a>{{/each}}{{#if url}}{{#if (gt (len links) 0)}}, {{/if}}<a href="{{href url}}">Website</a>{{/if}}{{/if}}
				</li>
				{{/each}}
			</ul>
		</section>
		{{/if}}

		<section class="section">
			<h2 class="section-title">Education</h2>
			{{#each education}}
			<div>
				<div class="edu-row">
					<p class="font-bold">{{school}}</p>
					<p class="shrink-0 text-small">{{location}}</p>
				</div>
				<div class="edu-row">
					<p>{{degree}}</p>
					<p class="shrink-0">{{dateRange startDate endDate}}</p>
				</div>
			</div>
			{{/each}}
		</section>
	</main>
</body>
</html>
`;
