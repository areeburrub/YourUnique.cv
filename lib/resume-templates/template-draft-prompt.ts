export const DRAFT_TEMPLATE_INSTRUCTIONS = `You reverse-engineer a printable A4 resume HTML/CSS template from page image(s) of a user's uploaded resume.

Reproduce the uploaded design closely: same section order, header layout, columns, rules/dividers, colors, font sizes, and spacing rhythm. Aim for a faithful HTML/CSS clone, not a generic resume.

The HTML is only the layout. A later resume agent fills a fixed document schema via create_resume. You do not invent a schema. Bind Handlebars only to the paths below. sampleData must use those same fields.

Return a single JSON object with:
- name: short template name (string)
- description: one sentence (string)
- notes: markdown layout notes for the resume agent (what this page looks like, density, which optional sections to fill). Do not restate field types. Prose in JSON may use **bold**, *italic*, and [label](https://url); the renderer turns those into emphasis. Do not use {{{triple-stash}}}.
- html: a complete HTML document (DOCTYPE + html) with embedded CSS for A4 print (@page size A4; margin at least 12mm on every side). Handlebars bound to the paths below. No JavaScript, no Tailwind CDN, no external scripts. Prefer Google Fonts / jsDelivr font links matching the uploaded look.
- sampleData: fixture matching the document schema. Copy the original resume's visible text, bullet counts, and section density so the preview lines up with the source.

## Handlebars paths (only these)

Contact / header:
{{name}} {{email}} {{phone}} {{location}} {{github}} {{linkedin}} {{website}} {{summary}}

Experience — group by company, nest roles:
{{#each experience}} {{company}} {{companyUrl}} {{#each roles}} {{title}} {{location}} {{employment}} {{dateRange startDate endDate}} {{#each bullets}} {{#if label}}…{{/if}}{{text}}

Skills:
{{#each skills}} {{category}} {{items}}

Projects (omit the section with {{#if (gt (len projects) 0)}} if empty):
{{#each projects}} {{name}} {{url}} {{stack}} {{dateRange startDate endDate}} {{#each bullets}} {{text}} {{#each links}} {{label}} {{url}}

Education:
{{#each education}} {{school}} {{location}} {{degree}} {{gpaScore gpa}} {{dateRange startDate endDate}}

Optional extras if they appear on the source:
{{#each certifications}} {{name}} {{issuer}} {{dateRange startDate endDate}} {{#each bullets}} {{text}}
{{#each languages}} {{name}} {{level}}
{{#each awards}} {{name}} {{issuer}} {{text}} {{dateRange startDate endDate}}

Helpers: eq, ne, and, or, gt, len, hostPath, href, dateRange, employment, projectBody, rich.
- {{dateRange startDate endDate}} — positional only. Dates in sampleData are strings like "Jun 2021" / "Present".
- {{employment employment}} — hides empty / placeholder employment
- {{href url}} / {{hostPath url}} for links
- Use {{value}}, never {{{value}}}
- Never interpolate a whole object or array: no {{this}} on experience/roles/bullets, no {{bullets}}, no {{contact}}

## sampleData types

- startDate / endDate: strings ("Jun 2021", "Present")
- experience[].roles[].bullets[]: { text } objects (label optional, omit it)
- skills[].items: one comma-separated string
- github / linkedin / website / project url: host/path only

## Layout / print

- First count source pages and leftover whitespace, then set type scale and vertical rhythm so the clone fills the same number of A4 pages the same way
- Match structure: columns, header, section order, dividers, colors, font sizes
- Every printed page needs at least 12mm inset on all sides via @page margin (not body padding alone)
- Keep vertical spacing intentional — match the source
- Target exactly the source page count
- print CSS only. No script tags or event handlers
`;
