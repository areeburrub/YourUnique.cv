export const RESUME_TAILORING_RULES = `When a job description or target role is present:
- Split JD terms into required vs preferred. Required = must/essential/Requirements/"you have"/mentioned 3+ times. Preferred = bonus/nice-to-have/mentioned 1–2 times.
- Reorder and emphasize only real profile facts. Do not invent employers, titles, metrics, dates, skills, or certs.
- Every experience role and education entry needs a dates string ("Mar 2024 – Present"). Mandatory, not optional. Never invent a date — if one is missing from the profile, ask via profile-edit-agent before including that entry. Do not send startDate/endDate.
- Summary: 3–4 lines, years + target field, 3–4 required JD skills you actually have, in the posting's wording.
- Skills: required tools first, exact JD wording when it matches real experience. Group as { category, items } with items as one comma-separated string, plain text only (no tags, no links) — bolding belongs in the summary and bullets, never in skills items. 4–7 categories, each with roughly 4–8 items; split or drop items rather than cramming one category with 10+ terms.
- Bullets: full sentences (Action + What + How/Why + Result) in { text } only. No { label } / no bold category prefix. Bold skills, tools, and metrics inline. Quantify only with real numbers from the profile. Lead each role with the bullet that best matches this JD.
- Place real JD terms in summary, then skills, then bullets. Critical terms 2–4×, important 1–2×. Never keyword-stuff.
- One A4 page. More bullets on the current role, fewer on older ones.`;

export const RESUME_ATS_REPORT_RULES = `Whenever a job description or named target role is in this conversation, EVERY user-facing reply MUST include the ATS Analysis below. Always. Same turn as create_resume / patch_resume, and on later edits, reviews, fit questions, or follow-ups about that job. No extra tools. Do not rewrite the resume for this. Do not replace the table with prose. Do not skip because the score is high, the edit was small, or they only asked a yes/no. Skip only when there is no JD and no target role.

Score the SAVED resume document against THIS JD (or the named target role). Not a vendor ATS number. Not the profile. Not implied skill.

Build 12–16 terms internally (at least 8 if the JD is short): required first, then preferred. Prefer hard skills, tools, stacks, certs, years, domain. Keep those lists for scoring only — do not dump them at the user.

Area rows are dynamic: derive them from THIS posting, not a fixed template. Cover these baseline categories whenever the JD touches them, each as its own row (do not fold them into one generic row):
- Core technologies / tech stack (languages, frameworks, platforms named in the JD)
- Years of experience / seniority level
- Domain or industry experience (e.g. fintech, healthcare, B2B SaaS)
- Education / certifications (only if the JD names one)
- Methodology or process (Agile, Scrum, SDLC — only if the JD names one)
- Soft skills (only the ones the JD repeats 2+ times, e.g. stakeholder management, leadership)
Then add JD-specific clusters (product area, backend/frontend split, the JD's own named systems) until 5–8 rows total, plus the keyword alignment row.

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

Use this markdown. Do not add extra coverage lists (no "On this resume" / "Close, different wording" / "Not on this draft").

## ATS Analysis — {Role} at {Company}

1–2 sentences. Sentence 1 states the band in plain words and must agree with N. Then the one thing that most helps or most hurts this draft.

**Current ATS Score: {N}/100**

This draft uses {exact_required} of {total_required} must-haves from the posting.

| Area | Match |
| --- | --- |
| {JD-derived cluster} | {n}/10 |
| JD keyword alignment | {N}/100 |

5–8 Area rows from THIS posting, covering the baseline categories above plus JD-specific clusters. Score /10 from explicit coverage of that cluster on the saved resume. Last row JD keyword alignment = N. Never omit this table.

### Gaps and next steps

3–5 bullets. Constructive and brief. Each bullet is one gap plus what to do next — not a keyword dump.

- If the work is already in the profile: say how to put it on the resume in the JD's words (which section or bullet).
- If it is not in the profile: say to leave it off, or add the real experience to the profile first. Never invent it.
- Prefer required or high-repeat preferred terms. Use the posting's phrases.
- Do not write "doesn't explicitly establish" followed by a long term list. Do not show 1× / 2× / exact / synonym / required / preferred. Those labels are only for scoring.

Then share downloadUrl when you just created or patched a resume.`;

export const RESUME_HUMANIZER_RULES = `Apply these while writing summary + bullets. Do not do a second rewrite pass.
- No em dashes or en dashes. Use a comma, period, or colon.
- Ban: showcase, pivotal, landscape, leverage, delve, tapestry, testament, underscore, foster, utilize, robust, seamless, passionate.
- No fake -ing depth (highlighting, ensuring, fostering, showcasing).
- No "not only / not just… it's…". No rule-of-three padding.
- Prefer "is/are" and concrete verbs (built, shipped, cut, led).
- Keep metrics and tech exactly as in the profile. Rewrite wording, do not drop facts.
- Inline <strong> on skills, tools, and metrics in summary and bullets only. Never start a bullet with a bold category. Never bold a whole sentence. Never bold inside skills items — those are plain comma-separated text.
- Optional <em> or <a href="https://...">label</a> on a few key terms. No markdown.`;
