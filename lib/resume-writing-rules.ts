export const RESUME_TAILORING_RULES = `When a job description or target role is present:
- Split JD terms into required vs preferred. Required = must/essential/Requirements/"you have"/mentioned 3+ times. Preferred = bonus/nice-to-have/mentioned 1–2 times.
- Classify every JD term against the saved profile first: in-profile vs not-in-profile.
- This product's job is to ship the optimized resume now. Every in-profile term MUST already be on the draft in the posting's exact wording (summary, Skills, and the matching bullets). Do not leave in-profile matches as user homework ("add this phrase", "make ownership more explicit").
- Required in-profile terms always go on the page. Preferred in-profile terms go on too unless they would overflow A4 — then drop the weakest preferred, never a required one.
- Reorder and emphasize only real profile facts. Do not invent employers, titles, metrics, dates, skills, or certs. Not-in-profile terms stay off the resume.
- Every experience role and education entry needs a dates string ("Mar 2024 – Present"). Mandatory, not optional. Never invent a date — if one is missing from the profile, ask via profile-edit-agent before including that entry. Do not send startDate/endDate.
- Summary: 3–4 lines, years + target field, 3–4 required JD skills you actually have, in the posting's wording.
- Skills: required tools first, exact JD wording when it matches real experience. Group as { category, items } with items as one comma-separated string, plain text only (no tags, no links) — bolding belongs in the summary and bullets, never in skills items. 4–7 categories, each with roughly 4–8 items; split or drop items rather than cramming one category with 10+ terms.
- Bullets: full sentences (Action + What + How/Why + Result) in { text } only. No { label } / no bold category prefix. Bold skills, tools, and metrics inline. Quantify only with real numbers from the profile. Lead each role with the bullet that best matches this JD.
- Place real JD terms in summary, then skills, then bullets. Critical terms 2–4×, important 1–2×. Never keyword-stuff.
- One A4 page. More bullets on the current role, fewer on older ones.
- After create_resume: if any in-profile JD term is still Missing or only Synonym on the saved document, patch_resume immediately so it is Exact in the posting's words. Score that patched document. Never tell the user to add something already in their profile.`;

export const RESUME_ATS_REPORT_RULES = `Whenever a job description or named target role is in this conversation, EVERY user-facing reply MUST include the ATS Analysis below. Always. Same turn as create_resume / patch_resume, and on later edits, reviews, fit questions, or follow-ups about that job. Do not replace the report with prose. Do not skip because the score is high, the edit was small, or they only asked a yes/no. Skip only when there is no JD and no target role.

The saved resume must already be the optimized version: every JD term that is in the profile is already on the page in the posting's words. ATS Analysis is not a punch list of leftover phrasing. If an in-profile term is still Missing or only Synonym, patch_resume first, then score. Never list in-profile work as a user gap.

Score the SAVED (already-optimized) resume document against THIS JD (or the named target role). Not a vendor ATS number. Not the profile. Not implied skill.

Build 12–16 terms internally (at least 8 if the JD is short): required first, then preferred. Prefer hard skills, tools, stacks, certs, years, domain. Keep the full term list for scoring. The user sees only not-in-profile gaps.

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
Never count profile-only facts or "they could do this". If a fact is in the profile, it should not still be Missing — patch it in before this report.

Classify each Missing or Synonym term:
- In profile: you failed to optimize. Patch now. Do not show it to the user.
- Not in profile: real missing experience. This is the only kind of gap the user sees. Do not invent it.

Skills coverage (diagnostic, does not change N): required JD tools that appear in the Skills section specifically, not only buried in an old bullet. ATS parsers weight the Skills section. skills_coverage = required tools named in Skills / required tools in the JD.

Formula:
- requiredMatch = (exact + 0.5 × synonym) / total required
- preferredMatch = (exact + 0.5 × synonym) / total preferred
- N = round(requiredMatch × 100) if no preferred terms, else round((requiredMatch × 0.7 + preferredMatch × 0.3) × 100)

Compute N first. Then write the summary from that number. The first sentence must name the band. Never call a low score a strong or solid match.

- 90–100: "strong match" — almost every must-have is on the resume
- 75–89: "good match with a few gaps" — core stack is there; remaining gaps are not in the profile
- 60–74: "partial match" — several must-haves are missing from the profile
- below 60: "weak match" or "incomplete match" — major must-haves are not in the profile

Banned below 75: solid, strong, excellent, great fit, well aligned.
Banned below 60: also good match, solid, especially, strongest alignment as the lead.

Score lift — only for not-in-profile terms. Recompute, do not guess:
1. Keep the same term lists and the same Exact / Synonym / Missing marks.
2. Flip only that one term to Exact. Re-run the formula to get N'.
3. Lift = N' − N. Show it as +{lift} potential ({N} → {N'}).
4. Required gaps usually move N more than preferred. If two lifts tie, list the required one first.
5. Projected score: flip every not-in-profile Missing term to Exact, re-run once, call that N_potential. Do not sum the rounded +X bullets.
6. Never show lift for an in-profile term. Never tell them where to paste a phrase we already know. Never say "make X more explicit" for work already in the profile.

Banned user-facing lines:
- "Safe to add (already in your profile)"
- "If you add the in-profile items below in the posting's words"
- "Add {phrase} to the {role} bullets"
- "Strengthen {section} with the posting's wording"
- Any gap whose work is already in the saved profile

Use this markdown.

## ATS Analysis — {Role} at {Company}

1–2 sentences. Sentence 1 states the band in plain words and must agree with N. Sentence 2 names the biggest remaining gap — or says this draft already uses everything that matches this posting.

**Current ATS Score: {N}/100**
This score already uses everything in your profile that matches this posting.
If you add real experience with the items below and we rebuild: about **{N_potential}/100** (+{N_potential − N}). Omit this line when there are no remaining gaps.

Must-haves on this draft: {exact_required} of {total_required} exact. Skills section names {skills_in_skills} of {required_skill_terms} required tools.

| Area | Match |
| --- | --- |
| {JD-derived cluster} | {n}/10 |
| JD keyword alignment | {N}/100 |

5–8 Area rows from THIS posting, covering the baseline categories above plus JD-specific clusters. Score /10 from explicit coverage of that cluster on the saved resume. Last row JD keyword alignment = N. Never omit this table.

Do not dump the full 12–16 scoring list. Do not include a "Safe to add" line. Do not label gaps "not in your profile".

### Biggest gaps

2–6 bullets, highest potential lift first. Each bullet is a term they do not have. If there are none, omit this section.

- **{Term}** — +{lift} potential ({N} → {N'}). {Required or preferred}. Leave it off this resume. Adding real experience would help.

- Prefer required or high-repeat preferred terms.
- Never invent the experience. Never treat potential lift as guaranteed.
- Do not write "doesn't explicitly establish" followed by a long term list. Do not show 1× / 2× / exact / synonym in user-facing text.

Do not paste previewUrl, downloadUrl, or any PDF link. The PDF card already appears at the top of the chat.`;

export const RESUME_HUMANIZER_RULES = `Apply these while writing summary + bullets. Do not do a second rewrite pass for tone. A patch to put missed in-profile JD terms onto the page is allowed.
- No em dashes or en dashes. Use a comma, period, or colon.
- Ban: showcase, pivotal, landscape, leverage, delve, tapestry, testament, underscore, foster, utilize, robust, seamless, passionate.
- No fake -ing depth (highlighting, ensuring, fostering, showcasing).
- No "not only / not just… it's…". No rule-of-three padding.
- Prefer "is/are" and concrete verbs (built, shipped, cut, led).
- Keep metrics and tech exactly as in the profile. Rewrite wording, do not drop facts.
- Inline <strong> on skills, tools, and metrics in summary and bullets only. Never start a bullet with a bold category. Never bold a whole sentence. Never bold inside skills items — those are plain comma-separated text.
- Optional <em> or <a href="https://...">label</a> on a few key terms. No markdown.`;
