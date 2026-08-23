export const notes = `# Classic Serif template notes

You produce a **structured JSON document** matching **this template's** schema (injected into the briefing / create_resume). Layout notes below are how this page reads.

The app renders the PDF from this template. Do **not** write a Typst, LaTeX, Markdown, or full HTML resume document.

This layout does **not** take a top-level \`location\` (header has no city line) and does **not** render GPA, certifications, languages, or awards. Do not send those fields.

## Work experience nesting (critical)

- Group by **company**. One company object can contain multiple \`roles\`.
- Same company, different titles (e.g. Intern → Founding Engineer) = **one** company with **two** roles — do not repeat the company name as separate top-level entries.
- Most recent company first; most recent role first within a company.
- Write bullets as readable sentences in \`{ "text": "..." }\` only. Omit \`label\`. Do not start with a bold category (\`<strong>AI product engineering:</strong> …\`). Bold skills, tools, and metrics inline with \`<strong>\`.

## Field rules

- \`github\`, \`linkedin\`, \`website\`, project \`url\`: **host/path only** (no \`https://\`, no markdown, no HTML)
- \`companyUrl\`, \`projects[].links[].url\`: **full https URLs** when known; omit if unknown. Never wrap these in \`[label](url)\`
- \`employment\`: only \`"Full-time"\`, \`"Part-time"\`, \`"Internship"\`, \`"Contract"\`, or similar real values from the profile
- If employment type is unknown, **omit** \`employment\` — never use placeholders
- \`location\` on roles: real city / \`"Remote"\` from the profile
- Header does **not** show location — put contact fields that exist; omit empty ones
- \`skills[].items\`: one comma-separated string
- \`projects[].stack\`: comma-separated tech stack for that project when known
- \`dates\`: one ready-to-print string, e.g. \`"Mar 2024 – Present"\` (en dash). Do not send startDate/endDate.
- This layout is **one A4 page by design**. Stay on one page: ~3–5 bullets on the current role, 2–3 on older roles, a short summary. Cut older or weaker items before overflowing.
- Prose fields (\`summary\`, bullet \`text\`) may use inline \`<strong>\`, \`<em>\`, and \`<a href="https://...">label</a>\`. Use sparingly on a few key terms, not whole sentences. No markdown. Skills \`items\` stay plain text.

## Projects

This template renders projects as compact one-liners: name, stack (if any), joined bullet text, then Links.

- Include \`stack\` for every technical project when known from the profile.
- Bullets should focus on what you built and the outcome — not restate the full stack.
- Write project bullets as sentences in \`text\` only (no \`label\`). Keep \`links\` for Website / GitHub / Product Hunt when available.

## Content rules

- Only use facts from the saved profile and the conversation
- Do not invent employers, titles, metrics, or dates
- Tailor summary, bullet selection/order, and skills categories to the job
- Humanize summary + bullets in the same write (no second pass)

## Tools

- \`create_resume\` — \`{ name, document, jobDescription?, companyName?, roleTitle?, jobLink? }\` (queues PDF; returns previewUrl / downloadUrl)
- \`patch_resume\` — \`{ id, patches[] }\` JSON Pointer ops on the saved document (also queues PDF). Do not resend the full document.
- Do not paste \`previewUrl\` or \`downloadUrl\`. The PDF card already appears in chat. Do not fetch the PDF yourself
- If a JD or target role is in play, the same chat reply is always an ATS Analysis: score /100, projected score if in-profile gaps are filled, Area/Match table, safe-to-add vs not-in-profile snapshot, and 4–6 gaps with score lift. No extra tools
`;
