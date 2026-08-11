# Resume document notes

You produce a **structured JSON document** and pass it to `create_resume` / `update_resume_document`.

The app renders the PDF. Do **not** write Typst, LaTeX, Markdown resumes, or any markup.

## Document shape

```json
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "+91-000-0000-000",
  "location": "City, Country",
  "github": "github.com/user",
  "linkedin": "linkedin.com/in/user",
  "website": "example.com",
  "summary": "One tight paragraph tailored to the job.",
  "experience": [
    {
      "company": "Company Name",
      "companyUrl": "https://company.example",
      "roles": [
        {
          "title": "Founding Engineer",
          "location": "Bangalore, India",
          "employment": "Full-time",
          "startDate": "Aug 2025",
          "endDate": "Present",
          "bullets": [
            { "label": "LLM Systems", "text": "Built LangGraph pipelines that process social and news data." },
            { "label": "Billing", "text": "Built Redis usage tracking and subscription billing." }
          ]
        },
        {
          "title": "Full Stack Developer Intern",
          "location": "Remote",
          "employment": "Internship",
          "startDate": "Nov 2024",
          "endDate": "Jul 2025",
          "bullets": [
            { "label": "Backend", "text": "Built NestJS services with PostgreSQL and Prisma." }
          ]
        }
      ]
    }
  ],
  "skills": [
    { "category": "Languages", "items": "TypeScript, Python, SQL" },
    { "category": "Backend", "items": "NestJS, FastAPI" }
  ],
  "projects": [
    {
      "name": "Project Name",
      "url": "example.com",
      "startDate": "Jan 2024",
      "endDate": "Jun 2024",
      "stack": "Next.js, TypeScript, PostgreSQL",
      "bullets": [
        { "label": "Product", "text": "What it does and the impact." }
      ],
      "links": [
        { "label": "Website", "url": "https://example.com" },
        { "label": "GitHub", "url": "https://github.com/user/repo" }
      ]
    }
  ],
  "education": [
    {
      "school": "School Name",
      "location": "City, Country",
      "degree": "Degree; CGPA or honors if relevant",
      "startDate": "Nov 2021",
      "endDate": "Jul 2025"
    }
  ]
}
```

## Work experience nesting (critical)

- Group by **company**. One company object can contain multiple `roles`.
- Same company, different titles (e.g. Intern → Founding Engineer) = **one** company with **two** roles — do not repeat the company name as separate top-level entries.
- Most recent company first; most recent role first within a company.
- Prefer labeled bullets: `{ "label": "Short Title", "text": "..." }` (renders as **Short Title:** …). Plain `{ "text": "..." }` is ok when a label does not fit.

## Field rules

- `github`, `linkedin`, `website`, project `url`: **host/path only** (no `https://`)
- `companyUrl`, `projects[].links[].url`: **full https URLs** when known; omit if unknown
- `employment`: only `"Full-time"`, `"Part-time"`, `"Internship"`, `"Contract"`, or similar real values from the profile
- If employment type is unknown, **omit** `employment` — never use placeholders
- `location` on roles: real city / `"Remote"` from the profile
- `skills[].items`: one comma-separated string
- `projects[].stack`: comma-separated tech stack for that project (required when the project uses notable tech). Do not bury the stack only inside bullets — put it in `stack`.
- Dates: `"Mon YYYY"` / `"Present"`
- Keep to roughly **one A4 page** (~4–8 bullets on the current role, fewer on older roles)
- Plain text in strings only — no Markdown bold, no HTML, no Typst

## Projects

- Include `stack` for every technical project when known from the profile.
- Bullets should focus on what you built and the outcome — not restate the full stack.
- Prefer labeled bullets; keep `links` for Website / GitHub / Product Hunt when available.

## Content rules

- Only use facts from `get_profile` and the conversation
- Do not invent employers, titles, metrics, or dates
- Tailor summary, bullet selection/order, and skills categories to the job
- After drafting, call `get_humanizer_notes` and apply those rules to summary + bullets
- When a JD is present, call `get_resume_builder_notes` and follow its analysis / ATS guidance

## Tools

- `create_resume` — `{ name, document, jobDescription? }`
- `update_resume_document` — `{ id, document }` full replace
- `compile_resume` — PDF; returns `previewUrl` / `downloadUrl`
- Give the user `downloadUrl`. Do not fetch the PDF yourself
