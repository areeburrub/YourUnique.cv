export const sampleData = {
    name: "Alex Rivera",
    email: "alex.rivera@email.com",
    phone: "+1 (415) 555-0148",
    location: "San Francisco, CA",
    github: "github.com/alexrivera",
    linkedin: "linkedin.com/in/alexrivera",
    website: "alexrivera.dev",
    summary:
        "Platform-minded software engineer with **5+ years** shipping ownership systems, **GraphQL** services, and reliable product infrastructure. Comfortable owning ambiguous problems end-to-end — from schema design and auth to **billing**, observability, and mentoring junior engineers.",
    experience: [
        {
            company: "Orbit Systems",
            companyUrl: "https://orbit.example",
            roles: [
                {
                    title: "Senior Product Engineer",
                    location: "San Francisco, CA",
                    employment: "Full-time",
                    startDate: "Mar 2024",
                    endDate: "Present",
                    bullets: [
                        {
                            label: "Platform",
                            text: "Led **GraphQL** federation across 6 services, cutting p95 API latency by **33%** and removing two hand-rolled BFF layers.",
                        },
                        {
                            label: "Ownership",
                            text: "Built role-aware onboarding used by **40+ PMs**; cut time-to-first-insight from 2 weeks to 2 days.",
                        },
                        {
                            label: "Billing",
                            text: "Shipped self-serve plan changes with **Stripe** webhooks, reducing billing support tickets **18%**.",
                        },
                        {
                            label: "Mentorship",
                            text: "Ran weekly design reviews for 3 engineers; introduced RFC template now used org-wide.",
                        },
                    ],
                },
                {
                    title: "Product Engineer",
                    location: "San Francisco, CA",
                    employment: "Full-time",
                    startDate: "Jan 2022",
                    endDate: "Feb 2024",
                    bullets: [
                        {
                            label: "Realtime",
                            text: "Designed websocket fan-out for collaborative boards serving **12k** concurrent editors.",
                        },
                        {
                            text: "Migrated auth to session + OAuth with audit logs; closed **14** high-severity findings from pen test.",
                        },
                        {
                            text: "Partnered with design on empty-state and error UX that lifted activation **9%**.",
                        },
                    ],
                },
            ],
        },
        {
            company: "Fieldnote",
            companyUrl: "https://fieldnote.example",
            roles: [
                {
                    title: "Software Engineer",
                    location: "Remote",
                    employment: "Full-time",
                    startDate: "Jun 2020",
                    endDate: "Dec 2021",
                    bullets: [
                        {
                            label: "Dashboards",
                            text: "Shipped role-aware OKR dashboards for enterprise customers across 3 plan tiers.",
                        },
                        {
                            label: "CI",
                            text: "Cut flaky E2E failures **60%** with quarantine + shard retries; preview deploys under 8 minutes.",
                        },
                        {
                            text: "Built CSV import pipeline processing **2M** rows/night with idempotent upserts.",
                        },
                    ],
                },
            ],
        },
        {
            company: "Northwind Labs",
            roles: [
                {
                    title: "Software Engineering Intern",
                    location: "Berkeley, CA",
                    employment: "Internship",
                    startDate: "May 2019",
                    endDate: "Aug 2019",
                    bullets: [
                        {
                            text: "Prototyped document search with **Elasticsearch**; improved internal findability for 200+ research notes.",
                        },
                        {
                            text: "Added typed API clients and snapshot tests for the Python data-service SDK.",
                        },
                    ],
                },
            ],
        },
    ],
    skills: [
        {
            category: "Languages",
            items: "TypeScript, Python, SQL, Go, HTML/CSS",
        },
        {
            category: "Frontend",
            items: "React, Next.js, Tailwind, Vite, Storybook",
        },
        {
            category: "Backend & Data",
            items: "Node.js, GraphQL, PostgreSQL, Redis, Prisma, Kafka",
        },
        {
            category: "Cloud & Ops",
            items: "AWS, Docker, Terraform, GitHub Actions, Datadog, Sentry",
        },
        {
            category: "Practices",
            items: "System design, RFCs, mentorship, incident response, accessibility",
        },
    ],
    projects: [
        {
            name: "Ledger Lite",
            url: "ledgerlite.dev",
            startDate: "2023",
            endDate: "Present",
            stack: "Next.js, PostgreSQL, Stripe, Playwright",
            bullets: [
                {
                    text: "Personal finance tracker with shared budgets, receipt OCR, and household permissions.",
                },
                {
                    text: "Open-sourced import adapters for Mint and CSV banks; **1.2k** GitHub stars.",
                },
            ],
            links: [
                {
                    label: "GitHub",
                    url: "https://github.com/alexrivera/ledger-lite",
                },
                {
                    label: "Website",
                    url: "https://ledgerlite.dev",
                },
            ],
        },
        {
            name: "Schema Garden",
            url: "schemagarden.dev",
            startDate: "2021",
            endDate: "2022",
            stack: "Go, PostgreSQL, React",
            bullets: [
                {
                    text: "Visual schema explorer for Postgres with diff previews and safe migration suggestions.",
                },
            ],
            links: [
                {
                    label: "GitHub",
                    url: "https://github.com/alexrivera/schema-garden",
                },
            ],
        },
    ],
    education: [
        {
            school: "University of California, Berkeley",
            location: "Berkeley, CA",
            degree: "B.S. Computer Science",
            startDate: "Aug 2016",
            endDate: "May 2020",
            gpa: "CGPA 3.82",
        },
    ],
} as const satisfies Record<string, unknown>;
