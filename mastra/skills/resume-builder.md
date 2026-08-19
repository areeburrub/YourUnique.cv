---
name: tailored-resume-generator
description: Analyzes job descriptions and generates tailored resumes that highlight relevant experience, skills, and achievements to maximize interview chances
---

# Tailored Resume Generator

When a user requests resume tailoring, or they share a job / JD / job link / specific target role (even without saying generate):

Treat that as a request to create a tailored resume in this turn. Do not ask if they want one. Past biography ("I was a PM at Acme") is not a target role.

### 1. Gather Information

**Job Description Analysis**:
- If they pasted a JD, attached a posting, or sent a LinkedIn job URL, use it immediately
- Ask for the company name and job title only if a target role is clearly intended but those are missing
- A named target role without a full JD is enough to draft — do not block on a posting

**Candidate Background** (YourUnique.cv):
- Always call `get_profile` first. The saved career profile is the source of truth (same role as `persona://about` in the portfolio MCP).
- Do **not** ask the user to paste their resume or restate work history, education, or skills.
- If the user attaches a resume, use it as extra context, but still ground facts in `get_profile`.
- If `get_profile` is empty, tell them to update Profile — do not interview for a full background from scratch.

### 2. Analyze Job Requirements

Split every JD term into **required** vs **preferred**, then into hard skills, tools, years, education/certs, domain, and only the soft skills the posting repeats.

Required language: "must have", "required", "essential", "you have", listed under Requirements, or mentioned 3+ times.
Preferred language: "nice to have", "bonus", "ideally", "a plus", or mentioned 1–2 times.

Create a mental map of:
- Priority 1: Critical requirements (deal-breakers)
- Priority 2: Important qualifications (strongly desired)
- Priority 3: Nice-to-have skills (bonus points)

Years-of-experience lines are often flexible (±2 years). Licenses, clearances, and named degrees marked required are not.

### 3. Map Candidate Experience to Requirements

For each job requirement:
- Identify matching experience from the saved profile
- Find transferable skills if no direct match
- Note gaps: in profile but weakly worded vs not in profile
- Identify unique strengths to highlight

Tailor by highlighting real work. Never invent employers, titles, metrics, dates, skills, or certifications.

Acceptable: reorder true facts, lead with the most relevant bullets, use the JD's exact phrasing when it still describes their work.
Unacceptable: adding tools they have not used, changing numbers, claiming titles or certs they do not have.

### 4. Structure the Tailored Resume

YourUnique.cv output is a **structured JSON document** via `create_resume` / `update_resume_document`. The document schema is on those tools. Do not write Typst, LaTeX, HTML, or a Markdown resume document. Prose fields may use inline `**bold**`, `*italic*`, and `[label](https://url)` on a few key terms. Contact and URL fields must be a plain host/path or https URL — never markdown.

Follow saved **resume style memory** over the defaults below when they conflict. When the user states a durable writing preference, save it with `update_resume_style`. Do not save one-off edits to a single resume.

**Keyword placement** (only terms they actually have):
1. Summary — 3–4 of the JD's top required skills, in the posting's wording
2. Skills — required tools first, exact JD names
3. Experience bullets — weave the same terms into real achievements
4. Density — critical terms 2–4 times across the resume, important terms 1–2 times. Never stuff

**Professional Summary** (3-4 lines):
- Lead with years of experience in the target role/field
- Include top 3-4 required skills from job description
- Mention industry experience if relevant
- Highlight unique value proposition

**Technical/Core Skills Section**:
- Group skills by category matching job requirements
- List required tools and technologies first
- Use exact terminology from job description
- Only include skills you can substantiate with experience
- Each skill group is `{ category, items }` where `items` is one comma-separated string
- Skills items are names only: software, languages, frameworks, methods. No statements
- Items are plain text — never `**bold**`, `*italic*`, or links inside a skills string. Bolding belongs only in summary/bullet prose
- 4–7 categories, each with roughly 4–8 items. If a category is growing past ~8 items, split it into two more specific categories or cut the least relevant ones rather than listing everything

**Professional Experience**:
- Group by company with nested `roles[]`. Same employer + multiple titles = one company object, multiple roles (do not repeat the company).
- **Date ranges are mandatory**: every role needs `startDate` and `endDate` (`"Present"` for current). Never invent or guess a date. If a role the user wants included has no date in the saved profile, ask for it before drafting that entry — do not leave it blank or use a placeholder.
- If dates look inconsistent (overlapping full-time roles, end before start, out-of-order roles at one company), ask the user to confirm rather than silently fixing or dropping them.
- For each role, emphasize responsibilities and achievements aligned with job requirements
- Lead each role with the bullet that best matches this JD
- Write each bullet as a readable sentence in `{ text }` only. Do **not** use `{ label }` or start with a bold category (`**AI product engineering:** …`)
- Bold skills, tools, metrics, and other important terms inline (`**NestJS**`, `**40%**`). Never bold a whole sentence
- Use action verbs: Led, Developed, Implemented, Optimized, Managed, Created, Analyzed. Never "Responsible for" or "Helped with"
- **Quantify achievements**: Include numbers, percentages, timeframes, scale — only from the profile
- Reorder bullet points to prioritize most relevant experience
- Use keywords naturally from job description
- Bullet shape: Action + What + How/Why + Result/Impact
- Set `employment` only when known (`Full-time`, `Internship`, …); omit if unknown — no placeholder text

**Education**:
- List degrees, certifications relevant to position
- Include relevant coursework if early career
- Add certifications that match job requirements
- **Date ranges are mandatory** here too: `startDate` and `endDate` for every degree. Ask if missing rather than guessing.

**Optional Sections** (if applicable):
- Certifications & Licenses
- Publications or Speaking Engagements
- Awards & Recognition
- Volunteer Work (if relevant to role)
- Projects (especially for technical roles)

### 5. Page and structure

The selected template owns layout. Fill the create_resume document; do not invent formatting.

- Keep to 1 page for <10 years experience, 2 pages for 10+ years
- Reverse chronological order (most recent first)
- One A4 page unless the template notes say otherwise
- More bullets on the current role, fewer on older ones

### 6. ATS score — calculate, do not guess

Score the **saved resume document** against **this JD**. Not a vendor ATS number. Not the profile. Not implied skill.

**Build the term lists** from this posting only (12–16 terms if the JD is long; at least 8 if it is short):
- Required first (must-haves + terms repeated 3+ times)
- Then preferred
- Prefer hard skills, tools, stacks, certs, years, domain. Drop one-off soft skills

**Area rows must cover these baseline categories whenever the JD touches them**, each as its own row — do not fold them into one generic row:
- Core technologies / tech stack (languages, frameworks, platforms the JD names)
- Years of experience / seniority level
- Domain or industry experience (fintech, healthcare, B2B SaaS, etc.)
- Education / certifications (only if the JD names one)
- Methodology or process (Agile, Scrum, SDLC — only if the JD names one)
- Soft skills (only ones the JD repeats 2+ times, e.g. stakeholder management, leadership)
Then add JD-specific clusters (product area, backend/frontend split, the JD's own named systems) until 8–12 rows total, plus the keyword alignment row.

**Classify each term against the saved resume**:
- **Exact** — the JD phrase, or a standard acronym pair (`SQL` / `Structured Query Language`), appears in summary, skills, or bullets
- **Synonym** — related wording only (`worked with teams` for `stakeholder management`)
- **Missing** — not on the resume

Never count "they could do this" or a profile fact that did not make it onto the resume.

**Formula**:
- `requiredMatch = (exact + 0.5 × synonym) / total required`
- `preferredMatch = (exact + 0.5 × synonym) / total preferred`
- If there are no preferred terms, `N = round(requiredMatch × 100)`
- Else `N = round((requiredMatch × 0.7 + preferredMatch × 0.3) × 100)`

**Bands** (compute N first, then write copy from the band. Never contradict the number):
- 90–100: "strong match" — almost every required term is exact on the resume
- 75–89: "good match with a few gaps" — core stack is exact
- 60–74: "partial match" — several required terms missing or only generic
- below 60: "weak match" / "incomplete match" — major must-haves are absent

Banned below 75: solid, strong, excellent, great fit, well aligned.
Banned below 60: also "good match" or leading with "strongest alignment".

### 7. After generate, ATS Analysis in the same reply

When the resume was tailored to a JD, the chat text after `create_resume` / `update_resume_document` must be an ATS Analysis. Same turn. No second rewrite pass.

```markdown
## ATS Analysis — {Role} at {Company}

2–3 sentences. First sentence states the band and must agree with N. Then what is on the resume, then the main gaps.

**Current ATS Score: {N}/100**

This draft uses {exact_required} of {total_required} must-haves from the posting.

| Area | Match |
| --- | --- |
| {JD-derived cluster} | {n}/10 |
| JD keyword alignment | {N}/100 |

### On this resume
{comma-separated JD terms that appear in the posting's wording}

### Close, different wording
- **{JD term}** — you wrote "{resume wording}"

### Not on this draft
{comma-separated missing JD terms}

### Biggest gaps

- {required or high-repeat preferred term that is synonym or missing}
```

- 8–12 Area rows covering the baseline categories (tech stack, years of experience, domain, certs/methodology if named, repeated soft skills) plus JD-specific clusters. Score each /10 from how explicitly that cluster appears on the saved resume. Last row is `JD keyword alignment` = N
- Coverage lists: 8–16 JD terms across the three groups. Use the posting's phrases. Do not show 1× / 2× / exact / synonym / required / preferred to the user
- Biggest gaps: 8–15 terms. Prefer required + high-repeat preferred. In one closing sentence, split "in profile, weak on resume" vs "not in profile"
- Do not invent experience. Close: do not keyword-stuff; if related work exists, describe it in the JD's terms

### 8. Iterate and Refine

Ask if user wants to:
- Adjust emphasis or tone
- Add or remove sections
- Develop role-specific versions (if applying to multiple similar positions)

### 9. Best Practices to Follow

**Do**:
- Be truthful and accurate - never fabricate experience
- Use industry-standard terminology
- Quantify achievements with specific metrics
- Tailor each resume to specific job
- Proofread for grammar and consistency
- Keep language concise and impactful

**Don't**:
- Include personal information (age, marital status, photo unless requested)
- Use first-person pronouns (I, me, my)
- Include references ("available upon request" is outdated)
- List every job if career is 20+ years (focus on relevant, recent experience)
- Exceed 2 pages unless very senior role

### 10. Special Considerations

**Career Changers**:
- Emphasize transferable skills
- Create compelling narrative in summary
- Focus on relevant projects and coursework

**Recent Graduates**:
- Lead with education
- Include relevant coursework, projects, internships
- Emphasize leadership in student organizations
- Include GPA if 3.5+

**Senior Executives**:
- Lead with executive summary
- Focus on leadership and strategic impact
- Include board memberships, speaking engagements
- Emphasize revenue growth, team building, vision

**Technical Roles**:
- List programming languages, frameworks, tools
- Include GitHub, portfolio, or project links
- For each project, include a `stack` field (comma-separated tech) separate from outcome bullets
- Mention methodologies (Agile, Scrum, etc.)

**Creative Roles**:
- Include link to portfolio
- Highlight creative achievements and campaigns
- Mention tools and software proficiencies
