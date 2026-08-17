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

@media print {
	body {
		background: white !important;
		padding: 0 !important;
		margin: 0 !important;
	}

	.page {
		box-shadow: none !important;
		margin: 0 !important;
	}
}

* {
	box-sizing: border-box;
}

body {
	margin: 0;
	background: #e5e5e5;
	color: #000;
	-webkit-font-smoothing: antialiased;
}

.page {
	font-family: "Computer Modern Serif", "CMU Serif", "Latin Modern Roman", "Liberation Serif", "Times New Roman", serif;
	font-size: 10pt;
	line-height: 12pt;
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
	margin-top: 4pt;
}

.section-title {
	font-size: 12pt;
	line-height: 14pt;
	font-weight: normal;
	font-variant: small-caps;
	letter-spacing: 0.03em;
	border-bottom: 0.6pt solid black;
	padding-bottom: 1pt;
	margin-bottom: 4pt;
}

.section-body {
	font-size: 9pt;
	line-height: 11pt;
}

.company {
	font-size: 12pt;
	line-height: 14pt;
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
	margin-bottom: 5pt;
}

.role-list > li::before,
.skill-list > li::before,
.project-list > li::before {
	content: "•";
	position: absolute;
	left: -0.12in;
	font-size: 9pt;
	line-height: 11pt;
}

.skill-list > li,
.project-list > li {
	position: relative;
	font-size: 9pt;
	line-height: 11pt;
	margin-bottom: 1pt;
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
	font-size: 10pt;
	line-height: 12pt;
}

.role-meta-row {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	gap: 8pt;
	font-size: 9pt;
	line-height: 11pt;
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
	font-size: 9pt;
	line-height: 11pt;
	margin-bottom: 1.5pt;
}

.sub-list > li::before {
	content: "◦";
	position: absolute;
	left: -0.15in;
	font-size: 9pt;
	line-height: 11pt;
}

.header-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	column-gap: 8pt;
	row-gap: 1pt;
	margin-bottom: 2pt;
}

.text-name {
	font-size: 14.4pt;
	line-height: 16pt;
	font-weight: bold;
}

.text-right {
	text-align: right;
}

.text-small {
	font-size: 9pt;
	line-height: 11pt;
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
	line-height: 12pt;
}

.edu-row + .edu-row {
	font-size: 9pt;
	line-height: 11pt;
	font-style: italic;
}

a {
	color: #000080;
	text-decoration: none;
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
