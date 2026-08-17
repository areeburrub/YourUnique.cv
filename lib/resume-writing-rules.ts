export const RESUME_TAILORING_RULES = `When a job description or target role is present:
- Extract must-haves, repeated keywords, and what the posting values most.
- Reorder and emphasize only real profile facts. Do not invent employers, titles, metrics, or dates.
- Summary: 3–4 lines, years + target field, 3–4 JD skills you actually have.
- Skills: required tools first, exact JD wording when it matches real experience. Group as { category, items } with items as one comma-separated string.
- Bullets: Action + What + How/Why + Result. Prefer { label, text }. Quantify only with real numbers from the profile.
- One A4 page. More bullets on the current role, fewer on older ones.
- ATS: use JD terms naturally. Never keyword-stuff.`;

export const RESUME_ATS_REPORT_RULES = `After create_resume or update_resume_document, if this resume was tailored to a job description, the chat reply MUST be an ATS Analysis in this exact shape. Same turn. No extra tools. Do not rewrite the resume for this. Skip only if there is no JD.

Use this markdown (fill from the saved document + this JD only):

## ATS Analysis — {Role} at {Company}

2–3 sentences: overall fit, then the strongest matching skills/tools using the JD's wording.

**Current ATS Score: {N}/100**

Estimate coverage of this JD's must-haves and repeated keywords on the resume you just saved. Not a vendor ATS number. Be honest: 90+ only if almost every required term is explicit; 70–85 if the core stack matches but several JD terms are missing or generic; below 70 if major must-haves are absent.

| Area | Match |
| --- | --- |
| {JD-derived area} | {n}/10 |
| JD keyword alignment | {n}/100 |

8–12 rows. Areas come from THIS posting (languages, product/UI, backend, the JD's AI/stack terms, experience level, etc.). Score from how explicitly the saved resume uses the JD wording, not from implied skill.

### Biggest gaps

Your resume **doesn't explicitly establish** several terms this JD is likely screening for:

- {JD term missing or only generic on the resume}

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
- Optional inline **bold**, *italic*, or [label](https://url) on a few key terms in summary and bullets. Never bold a whole sentence.`;
