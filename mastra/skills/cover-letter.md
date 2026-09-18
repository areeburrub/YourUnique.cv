---
name: cover-letter
description: Writes a short, easy-to-read cover letter in chat from the saved career profile and a job posting. Use when the user asks for a cover letter, covering letter, application letter, motivation letter, or a letter for this job.
---

# Cover letter

A cover letter has one job: earn a resume read from someone who spends under thirty seconds on it. Most letters fail in the first sentence ("I am writing to apply") and then restate the resume. This product writes a **short, scannable letter in chat** when the user asks. It does not auto-write one just because they pasted a JD.

Ground every claim in the saved career profile. Never invent employers, titles, metrics, tools, or company news.

## When to write

Write this turn if they asked for a cover letter, covering letter, application letter, motivation letter, a cover note, or "a letter for this job".

Do not refuse. Do not say the product only does resumes. Do not create or patch a resume PDF unless they also asked to make or change a resume.

Skip ATS Analysis on a letter-only turn. If they asked for a resume and a letter, do the resume + ATS first, then the letter in the same reply.

## Inputs

Use what is already loaded:

1. Saved career profile (already in the briefing). Do not ask them to paste a resume.
2. Job posting from this thread, or fetch a LinkedIn / careers URL they sent without pasting the text.
3. Hiring manager name only if they gave it.

If there is no posting and no company/role, ask once for the job text, a URL, or the company + role. Then write. Do not interview for biography.

## How to write

1. Rank the posting's requirements by repetition, position, and specificity. Keep the top two they can actually prove from the profile. Skip a requirement that is not in the profile. Do not fabricate adjacent proof.
2. Open with one company-specific sentence that would be false if sent to a different employer (product, mission, or problem named in the posting). Then name the role and the strongest profile match.
3. Prove those two requirements with real outcomes. Use the posting's words for skills they have. Include a number when the profile has one. Do not copy resume bullets.
4. Close with a plain ask for a conversation.
5. Cut to 90–130 words (hard cap 140). Most sentences under 20 words. Three short paragraphs with a blank line between them.

## Shape

```markdown
## Cover letter — {Role} at {Company}

Dear {Name or Company team},

{opening}

{proof}

{close}

{Name from profile}
```

LinkedIn Easy Apply / "short note": 80–110 words, one block, no greeting or sign-off.

## Do

- First person. Contractions are fine.
- Evidence over adjectives.
- Mix sentence length so it is easy to skim.
- Copy-ready markdown in chat. Not a PDF. Not a code fence unless they ask.

## Do not

- "I am writing to apply", "I am excited", "passionate", "driven", "thrilled", "great fit"
- leverage, utilize, synergy, robust, seamless, fast-paced, team player, detail-oriented, results-driven
- Furthermore, Additionally, In conclusion, To summarize
- "not only / not just… it's…"
- Em dashes or en dashes
- Bullet lists inside the letter
- "To Whom It May Concern"
- "please find attached" / "do not hesitate"
- Address block, date, or extra contact lines (those are on the resume)
- Restate the resume or summarize the JD back to the employer

If they ask for shorter, cut toward 80 words.
