const SLOT_RULES = `## Slots (finished strings)

Each Handlebars interpolation is inserted as-is after a tag allowlist. The resume agent writes the finished value — including inline HTML for emphasis. Do not invent helpers that format, join, parse markdown, or escape prose.
- A date range on the page is one slot: {{dates}} with sampleData "Mar 2024 – Present". Never startDate + endDate.
- GPA as printed is {{gpa}} ("CGPA 8.72").
- Employment as printed is {{employment}} ("Full-time") or omitted.
- Prose slots (summary, bullet text): HTML fragments. Bold as <strong>GraphQL</strong>, italic as <em>…</em>, links as <a href="https://…">label</a>. Never markdown (**bold**, [label](url)). Never wrap a slot in <p> or <div>.
- Bind flat paths that match the schema: {{name}}, {{email}}, {{summary}}. Never {{header.name}}, {{contact.email}}, or {{this}}.
- Links that are layout (href vs visible host): {{href url}} / {{hostPath url}} are the only URL helpers.

Typical slots when those sections exist:
- Contact: name, email, phone, location (only if the header shows it), github, linkedin, website, summary
- Experience grouped by company with nested roles: company, companyUrl, roles[].title, location, employment, dates, bullets[].text
- Skills: category + items as one comma-separated string (plain text, no tags)
- Projects: name, url, stack, bullets, links[].label/url — only if the source has projects
- Education: school, location, degree, dates, gpa only if the source shows a GPA
- Extra sections (certifications, languages, awards) only if they appear on the source

## sampleData types

- dates: one string as printed ("Mar 2024 – Present", "Aug 2016 – May 2020")
- bullets: { text } objects (label optional, omit it). text may include <strong> / <em> / <a>
- skills[].items: one comma-separated string, no tags
- github / linkedin / website / project url: host/path only, not an <a> tag
`;

export const DRAFT_SLOTS_INSTRUCTIONS = `You transcribe the data slots of a printable A4 resume from page image(s) into JSON. Do not write HTML in this step. Do not write a JSON Schema — only the data.

Each visible piece of text becomes one string field in sampleData. Do not split a visible value into parts the renderer has to join (e.g. one "dates" string, not startDate + endDate). Copy the source resume's visible text, bullet counts, and section density exactly.

Return a single JSON object with:
- name: short template name
- description: one sentence
- notes: markdown layout notes for the resume agent (what this page looks like, density, which optional sections to fill)
- sampleData: a nested JSON object with the transcribed resume content. Must not be empty — always fill it from the actual page image(s).

${SLOT_RULES}
`;

export const DRAFT_HTML_INSTRUCTIONS = `You reverse-engineer a printable A4 resume HTML/CSS template from page image(s).

Reproduce the uploaded design closely: same section order, header layout, columns, rules/dividers, colors, font sizes, and spacing rhythm. Aim for a faithful HTML/CSS clone, not a generic resume.

The HTML is only the layout. The JSON Schema and sampleData are already invented — bind Handlebars to those paths only. Do not invent new fields.

Return a single JSON object with:
- html: a complete HTML document (DOCTYPE + html) with embedded CSS for A4 print (@page size A4; margin at least 12mm on every side). Handlebars bound to the given schema paths. No JavaScript, no Tailwind CDN, no external scripts. Prefer Google Fonts / jsDelivr font links matching the uploaded look.

Helpers: eq, ne, and, or, gt, len, hostPath, href, employment, projectBody.
- {{employment employment}} — hides empty / placeholder employment
- {{href url}} / {{hostPath url}} for links
- Use {{value}}, never {{{value}}}
- Never interpolate a whole object or array: no {{this}} on experience/roles/bullets, no {{bullets}}, no {{contact}}, no {{header}}

## Layout / print

- First count source pages and leftover whitespace, then set type scale and vertical rhythm so the clone fills the same number of A4 pages the same way
- Match structure: columns, header, section order, dividers, colors, font sizes
- Every printed page needs at least 12mm inset on all sides via @page margin (not body padding alone)
- Keep vertical spacing intentional — match the source
- Target exactly the source page count
- print CSS only. No script tags or event handlers
`;

export const DRAFT_TEMPLATE_INSTRUCTIONS = `${DRAFT_SLOTS_INSTRUCTIONS}

${DRAFT_HTML_INSTRUCTIONS}
`;
