# Resume TeX template notes

Only edit `resume.tex` (stored as `sourceTex`). `templates/resume/main.tex` is static layout and must not be changed via tools. This is the same contract as the portfolio MCP (`documents://resume-template-notes`).

## Document flow

- Compile writes the generation's `sourceTex` as `resume.tex` next to the static `main.tex`, then runs Tectonic.
- Keep content to roughly **one A4 page**. Prefer cutting weaker bullets over shrinking font or inventing macros.

## Suggested structure (match this order)

Use this section order and nesting. Do not invent a different layout or macros that are not listed below.

1. **Heading** — `tabular*` with name (left) and contact (right). Include email, site, phone, GitHub, LinkedIn via `\href{...}{...}`.
2. **Summary** — short `\section{Summary}` + `\small` paragraph. 2–4 sentences, role-targeted, no bullets.
3. **Work Experience** — `\section{Work Experience}` then per company:
   - `\resumeCompany{...}` (company name; link + `\textbf{...}` ok)
   - `\resumeRoleListStart` … `\resumeRoleListEnd`
   - For each role under that company: `\item` then `\resumeRole{Title}{Location}{Employment Type}{Date Range}` then achievement bullets in `\resumeSubBulletStart` … `\resumeSubBulletEnd`
   - Prefer `\resumeItem{Label}{Body}` for achievements (bold label + body). Use `\resumeBullet{Body}` only when a label does not fit.
4. **Skills** — `\section{Skills}` with `\resumeListStart` / `\resumeListEnd` and `\resumeSkill{Category}{comma-separated items}`.
5. **Projects** — `\section{Projects}` with `\resumeListStart` / `\resumeListEnd`. Each project is `\resumeSkill{Name}{Description + Links: \href{...}{Label}, ...}`.
6. **Education** — `\section{Education}` with `\resumeEntry{School}{Location}{Degree; details}{Date Range}` (not inside a list).

Optional sections (only if space and relevant): keep them after Skills / before Education, still using the same macros. Do not add custom environments.

## Skeleton (copy this shape)

```tex
% !TEX root = main.tex
%----------HEADING-----------------
\begin{tabular*}{\textwidth}[t]{l@{\extracolsep{\fill}}r}
  \textbf{\Large Full Name} & \href{mailto:email@example.com}{email@example.com} \\
  \href{https://example.com}{example.com} & +91-000-0000-000 \\
  \href{https://github.com/user}{github.com/user} & \href{https://linkedin.com/in/user}{linkedin.com/in/user} \\
\end{tabular*}

%-----------SUMMARY-----------------
\section{Summary}
\small One tight paragraph tailored to the job. Emphasize stack and outcomes with \textbf{keywords}.

%-----------WORK EXPERIENCE-----------------
\section{Work Experience}

\resumeCompany{\href{https://company.example}{\textbf{Company Name}}}

\resumeRoleListStart
  \item
  \resumeRole{Role Title}{City, Country}{Full-time}{Mon YYYY to Present}
  \resumeSubBulletStart
    \resumeItem{Label}{Outcome-focused bullet with \textbf{tech} and a metric when true.}
    \resumeItem{Label}{Another concrete achievement.}
  \resumeSubBulletEnd
  \item
  \resumeRole{Earlier Role}{Remote}{Internship}{Mon YYYY to Mon YYYY}
  \resumeSubBulletStart
    \resumeItem{Label}{Shorter bullets for older roles.}
  \resumeSubBulletEnd
\resumeRoleListEnd

%-----------SKILLS-----------------
\section{Skills}
\resumeListStart
  \resumeSkill{Languages}{TypeScript, Python, SQL}
  \resumeSkill{Backend}{NestJS, FastAPI}
  \resumeSkill{Databases}{PostgreSQL, Redis}
  \resumeSkill{Frontend}{Next.js, React}
  \resumeSkill{Cloud / Infra}{AWS, Docker, Kubernetes}
  \resumeSkill{AI Frameworks}{LangGraph, LangChain}
\resumeListEnd

%-----------PROJECTS-----------------
\section{Projects}
\resumeListStart
  \resumeSkill{Project Name}
    {What it does, stack, and impact.
    Links: \href{https://example.com}{Website}, \href{https://github.com/user/repo}{GitHub}}
\resumeListEnd

%-----------EDUCATION-----------------
\section{Education}
\resumeEntry
  {School Name}{City, Country}
  {Degree; CGPA or honors if relevant}{Mon YYYY to Mon YYYY}
```

## Nesting rules (Work Experience)

```
\resumeCompany{...}
\resumeRoleListStart
  \item
  \resumeRole{...}{...}{...}{...}
  \resumeSubBulletStart
    \resumeItem{...}{...}   % or \resumeBullet{...}
  \resumeSubBulletEnd
\resumeRoleListEnd
```

- One company block can contain multiple `\item` + role blocks.
- Put the strongest / most recent company first; most recent role first under a company.
- Aim for ~4–8 `\resumeItem`s on the current role, fewer on older roles.
- Labels are short title case (`Cost Optimization`, `Billing \& Usage`). Escape `&` as `\&`.

## Available macros (from main.tex)

- `\resumeCompany{Name}`
- `\resumeRole{Role}{Location}{Employment Type}{Date Range}`
- `\resumeEntry{School}{Location}{Degree}{Dates}`
- `\resumeItem{Label}{Body}`
- `\resumeBullet{Body}`
- `\resumeSkill{Label}{Body}`
- `\resumeListStart` / `\resumeListEnd`
- `\resumeBulletStart` / `\resumeBulletEnd`
- `\resumeRoleListStart` / `\resumeRoleListEnd`
- `\resumeSubBulletStart` / `\resumeSubBulletEnd`

Do **not** invent macros like `\resumeheader`. Use only the macros above plus standard LaTeX (`\section`, `\textbf`, `\href`, `tabular*`).

## Rules for LLM-authored TeX

- Escape LaTeX specials in plain text: `# $ % & _ { }`
- Prefer `\textbf{...}` for stack/keywords already used in the template style
- Do not invent employers, titles, metrics, or dates that are not in `get_profile`
- Tailor Summary, role bullet selection/order, and Skills categories to the job — do not fabricate experience
- After drafting, call `get_humanizer_notes` and apply those rules to Summary + bullet prose before finalizing
- When a job description is present, call `get_resume_builder_notes` and follow its JD analysis, priority mapping, Action+What+How+Result bullets, and ATS keywords

## Editing (token-efficient)

- Prefer `append_to_resume` for new sections/bullets
- Prefer `patch_resume` for small edits (unique `old_string` → `new_string`)
- Do **not** rewrite the full `sourceTex` unless restructuring the whole file
- Patch responses return success metadata only (not the full file)

## PDF download

- Call `compile_resume` — it waits until the PDF is ready and returns `previewUrl` / `downloadUrl`
- Give the user the `downloadUrl`. Do **not** fetch, curl, or download the PDF yourself
- The chat UI shows the PDF preview from the compile tool result
