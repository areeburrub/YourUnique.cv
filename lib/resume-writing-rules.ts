export const RESUME_TAILORING_RULES = `When a job description or target role is present:
- Extract must-haves, repeated keywords, and what the posting values most.
- Reorder and emphasize only real profile facts. Do not invent employers, titles, metrics, or dates.
- Summary: 3–4 lines, years + target field, 3–4 JD skills you actually have.
- Skills: required tools first, exact JD wording when it matches real experience. Group as { category, items } with items as one comma-separated string.
- Bullets: Action + What + How/Why + Result. Prefer { label, text }. Quantify only with real numbers from the profile.
- One A4 page. More bullets on the current role, fewer on older ones.
- ATS: use JD terms naturally. Never keyword-stuff.`;

export const RESUME_HUMANIZER_RULES = `Apply these while writing summary + bullets. Do not do a second rewrite pass.
- No em dashes or en dashes. Use a comma, period, or colon.
- Ban: showcase, pivotal, landscape, leverage, delve, tapestry, testament, underscore, foster, utilize, robust, seamless, passionate.
- No fake -ing depth (highlighting, ensuring, fostering, showcasing).
- No "not only / not just… it's…". No rule-of-three padding.
- Prefer "is/are" and concrete verbs (built, shipped, cut, led).
- Keep metrics and tech exactly as in the profile. Rewrite wording, do not drop facts.`;
