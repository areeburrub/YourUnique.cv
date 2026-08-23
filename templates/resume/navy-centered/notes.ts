export const notes = `# Navy Centered template notes

You produce a **structured JSON document** matching **this template's** schema (injected into the briefing / create_resume). Layout notes below are how this page reads.

The app renders the PDF from this template. Do **not** write a Typst, LaTeX, Markdown, or full HTML resume document.

This layout **requires** top-level \`location\` in the centered header. Education may include optional \`gpa\`. Do not send certifications, languages, or awards — they are not rendered.

## Layout (how this page reads)

- Centered header: name, then location / phone / email, then website / GitHub / LinkedIn
- **Location belongs in the header** — it is not omitted
- Section titles render as EXECUTIVE SUMMARY, WORK EXPERIENCE, SKILLS, PROJECTS, EDUCATION
- Dates render as one \`dates\` string: \`Mar 2024 – Present\` (en dash). Do not send startDate/endDate or date objects.
- Projects render as **Name (url)** plus their own bullets, not a one-line dump

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
- \`skills[].items\`: one comma-separated string
- \`projects[].stack\`: comma-separated tech stack for that project when known
- \`dates\`: one ready-to-print string, e.g. \`"Mar 2024 – Present"\` (en dash). Do not send startDate/endDate.
- \`education[].gpa\`: score with label only, e.g. \`"CGPA 8.72"\` or \`"GPA 3.8"\`. No /10, /4.0, or "out of". Omit if unknown — do not invent a score
- This layout is **one A4 page by design**. Stay on one page: ~3–5 bullets on the current role, 2–3 on older roles, 1–2 project bullets, a short summary. Cut older or weaker items before overflowing.
- Prose fields (\`summary\`, bullet \`text\`) may use inline \`<strong>\`, \`<em>\`, and \`<a href="https://...">label</a>\`. Bold a few metrics and technologies, not whole sentences. No markdown. Skills \`items\` stay plain text.

## Projects

This template gives each project a title line and its own bullets.

- Put the live site in \`url\` (host/path). Extra GitHub / Product Hunt links go in \`links\`.
- Include \`stack\` when known — it renders under the title in muted type.
- Bullets should focus on what you built and the outcome — not restate the full stack.

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
