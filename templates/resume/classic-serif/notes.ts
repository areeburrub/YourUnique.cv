export const notes = `# Classic Serif template notes

You produce a **structured JSON document** matching this template's \`inputSchema\` and pass it to \`create_resume\` / \`update_resume_document\`.

The app renders the PDF from this template. Do **not** write Typst, LaTeX, Markdown resumes, HTML, or any markup.

## Work experience nesting (critical)

- Group by **company**. One company object can contain multiple \`roles\`.
- Same company, different titles (e.g. Intern → Founding Engineer) = **one** company with **two** roles — do not repeat the company name as separate top-level entries.
- Most recent company first; most recent role first within a company.
- Prefer labeled bullets: \`{ "label": "Short Title", "text": "..." }\` (renders as **Short Title:** …). Plain \`{ "text": "..." }\` is ok when a label does not fit.

## Field rules

- \`github\`, \`linkedin\`, \`website\`, project \`url\`: **host/path only** (no \`https://\`)
- \`companyUrl\`, \`projects[].links[].url\`: **full https URLs** when known; omit if unknown
- \`employment\`: only \`"Full-time"\`, \`"Part-time"\`, \`"Internship"\`, \`"Contract"\`, or similar real values from the profile
- If employment type is unknown, **omit** \`employment\` — never use placeholders
- \`location\` on roles: real city / \`"Remote"\` from the profile
- Header does **not** show location — put contact fields that exist; omit empty ones
- \`skills[].items\`: one comma-separated string
- \`projects[].stack\`: comma-separated tech stack for that project when known
- Dates: \`"Mon YYYY"\` / \`"Present"\`
- Keep to roughly **one A4 page** (~4–8 bullets on the current role, fewer on older roles)
- Prose fields (\`summary\`, bullet \`text\`, skill \`items\`) may use inline \`**bold**\`, \`*italic*\`, and \`[label](https://url)\`. Use sparingly on a few key terms, not whole sentences. No HTML, Typst, or LaTeX in strings.

## Projects

This template renders projects as compact one-liners: name, stack (if any), joined bullet text, then Links.

- Include \`stack\` for every technical project when known from the profile.
- Bullets should focus on what you built and the outcome — not restate the full stack.
- Prefer labeled bullets; keep \`links\` for Website / GitHub / Product Hunt when available.

## Content rules

- Only use facts from the saved profile and the conversation
- Do not invent employers, titles, metrics, or dates
- Tailor summary, bullet selection/order, and skills categories to the job
- Humanize summary + bullets in the same write (no second pass)

## Tools

- \`create_resume\` — \`{ name, document, jobDescription?, companyName?, roleTitle?, jobLink? }\` (queues PDF; returns previewUrl / downloadUrl)
- \`update_resume_document\` — \`{ id, document }\` full replace (also queues PDF)
- Give the user \`downloadUrl\`. Do not fetch the PDF yourself
`;
