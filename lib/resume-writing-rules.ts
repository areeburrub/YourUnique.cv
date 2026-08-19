export const RESUME_TAILORING_RULES = `When a job description or target role is present:
- Split JD terms into required vs preferred. Required = must/essential/Requirements/"you have"/mentioned 3+ times. Preferred = bonus/nice-to-have/mentioned 1–2 times.
- Reorder and emphasize only real profile facts. Do not invent employers, titles, metrics, dates, skills, or certs.
- Every experience role and education entry needs startDate and endDate ("Present" for current). Mandatory, not optional. Never invent a date — if one is missing from the profile, ask via profile-edit-agent before including that entry.
- Summary: 3–4 lines, years + target field, 3–4 required JD skills you actually have, in the posting's wording.
- Skills: required tools first, exact JD wording when it matches real experience. Group as { category, items } with items as one comma-separated string, plain text only (no **bold**, no links) — bolding belongs in the summary and bullets, never in skills items. 4–7 categories, each with roughly 4–8 items; split or drop items rather than cramming one category with 10+ terms.
- Bullets: full sentences (Action + What + How/Why + Result) in { text } only. No { label } / no bold category prefix. Bold skills, tools, and metrics inline. Quantify only with real numbers from the profile. Lead each role with the bullet that best matches this JD.
- Place real JD terms in summary, then skills, then bullets. Critical terms 2–4×, important 1–2×. Never keyword-stuff.
- One A4 page. More bullets on the current role, fewer on older ones.`;

export const RESUME_ATS_REPORT_RULES = `After create_resume or update_resume_document, if this resume was tailored to a job description, the chat reply MUST be an ATS Analysis in this exact shape. Same turn. No extra tools. Do not rewrite the resume for this. Skip only if there is no JD.

Score the SAVED resume document against THIS JD only. Not a vendor ATS number. Not the profile. Not implied skill.

Build 12–16 terms (at least 8 if the JD is short): required first, then preferred. Prefer hard skills, tools, stacks, certs, years, domain.

Area rows must cover these baseline categories whenever the JD touches them, each as its own row (do not fold them into one generic row):
- Core technologies / tech stack (languages, frameworks, platforms named in the JD)
- Years of experience / seniority level
- Domain or industry experience (e.g. fintech, healthcare, B2B SaaS)
- Education / certifications (only if the JD names one)
- Methodology or process (Agile, Scrum, SDLC — only if the JD names one)
- Soft skills (only the ones the JD repeats 2+ times, e.g. stakeholder management, leadership)
Then add JD-specific clusters (product area, backend/frontend split, the JD's own named systems) until 8–12 rows total, plus the keyword alignment row.

Per term vs the saved resume:
- Exact: JD phrase or standard acronym pair appears in summary, skills, or bullets
- Synonym: related wording only
- Missing: not on the resume
Never count profile-only facts or "they could do this".

Formula:
- requiredMatch = (exact + 0.5 × synonym) / total required
- preferredMatch = (exact + 0.5 × synonym) / total preferred
- N = round(requiredMatch × 100) if no preferred terms, else round((requiredMatch × 0.7 + preferredMatch × 0.3) × 100)

Compute N first. Then write the summary from that number. The first sentence must name the band. Never call a low score a strong or solid match.

- 90–100: "strong match" — almost every must-have is on the resume
- 75–89: "good match with a few gaps" — core stack is there
- 60–74: "partial match" — several must-haves are missing or only implied
- below 60: "weak match" or "incomplete match" — major must-haves are missing

Banned below 75: solid, strong, excellent, great fit, well aligned.
Banned below 60: also good match, solid, especially, strongest alignment as the lead.

Use this markdown:

## ATS Analysis — {Role} at {Company}

2–3 sentences. Sentence 1 states the band in plain words and must agree with N. Then what is actually on the resume, then the main gaps.

**Current ATS Score: {N}/100**

This draft uses {exact_required} of {total_required} must-haves from the posting.

| Area | Match |
| --- | --- |
| {JD-derived cluster} | {n}/10 |
| JD keyword alignment | {N}/100 |

8–12 Area rows from THIS posting, covering the baseline categories above plus JD-specific clusters. Score /10 from explicit coverage of that cluster on the saved resume. Last row JD keyword alignment = N.

### On this resume
{comma-separated JD terms that appear in the posting's wording}

### Close, different wording
- **{JD term}** — you wrote "{resume wording}"

### Not on this draft
{comma-separated missing JD terms}

8–16 terms total across the three groups. Use the posting's phrases. Never write 1× / 2× / exact / synonym / required / preferred in the user-facing text. Those labels are only for scoring.

### Biggest gaps

Your resume **doesn't explicitly establish** several terms this JD is likely screening for:

- {required or high-repeat preferred term that is synonym or missing}

8–15 terms. Prefer exact JD phrases. Split "in profile, weak on resume" vs "not in profile" in one closing sentence.

Close with: do not add terms they have not done. If related work exists, say they should describe that work with the JD's wording rather than stuffing keywords.

Then share downloadUrl.`;

export const RESUME_HUMANIZER_RULES = `Apply these while writing summary + bullets. Do not do a second rewrite pass.
- No em dashes or en dashes. Use a comma, period, or colon.
- Ban: showcase, pivotal, landscape, leverage, delve, tapestry, testament, underscore, foster, utilize, robust, seamless, passionate.
- No fake -ing depth (highlighting, ensuring, fostering, showcasing).
- No "not only / not just… it's…". No rule-of-three padding.
- Prefer "is/are" and concrete verbs (built, shipped, cut, led).
- Keep metrics and tech exactly as in the profile. Rewrite wording, do not drop facts.
- Inline **bold** skills, tools, and metrics in summary and bullets only. Never start a bullet with a bold category. Never bold a whole sentence. Never bold inside skills items — those are plain comma-separated text.
- Optional *italic* or [label](https://url) on a few key terms.`;
