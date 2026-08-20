export const sampleData = {
    name: "Alex Rivera",
    email: "alex.rivera@email.com",
    phone: "+1 (415) 555-0148",
    location: "San Francisco, CA",
    github: "github.com/alexrivera",
    linkedin: "linkedin.com/in/alexrivera",
    website: "alexrivera.dev",
    summary:
        "Platform-minded software engineer with <strong>5+ years</strong> shipping ownership systems, <strong>GraphQL</strong> services, and reliable product infrastructure. Comfortable owning ambiguous problems end-to-end — from schema design and auth to <strong>billing</strong>, observability, and mentoring junior engineers.",
    experience: [
        {
            company: "Orbit Systems",
            companyUrl: "https://orbit.example",
            roles: [
                {
                    title: "Senior Product Engineer",
                    location: "San Francisco, CA",
                    employment: "Full-time",
                    dates: "Mar 2024 – Present",
                    bullets: [
                        {
                            label: "Platform",
                            text: "Led <strong>GraphQL</strong> federation across 6 services, cutting p95 API latency by <strong>33%</strong> and removing two hand-rolled BFF layers.",
                        },
                        {
                            label: "Ownership",
                            text: "Built role-aware onboarding used by <strong>40+ PMs</strong>; cut time-to-first-insight from 2 weeks to 2 days.",
                        },
                        {
                            label: "Billing",
                            text: "Shipped self-serve plan changes with <strong>Stripe</strong> webhooks, reducing billing support tickets <strong>18%</strong>.",
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
                    dates: "Jan 2022 – Feb 2024",
                    bullets: [
                        {
                            label: "Realtime",
                            text: "Designed websocket fan-out for collaborative boards serving <strong>12k</strong> concurrent editors.",
                        },
                        {
                            text: "Migrated auth to session + OAuth with audit logs; closed <strong>14</strong> high-severity findings from pen test.",
                        },
                        {
                            text: "Partnered with design on empty-state and error UX that lifted activation <strong>9%</strong>.",
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
                    dates: "Jun 2020 – Dec 2021",
                    bullets: [
                        {
                            label: "Dashboards",
                            text: "Shipped role-aware OKR dashboards for enterprise customers across 3 plan tiers.",
                        },
                        {
                            label: "CI",
                            text: "Cut flaky E2E failures <strong>60%</strong> with quarantine + shard retries; preview deploys under 8 minutes.",
                        },
                        {
                            text: "Built CSV import pipeline processing <strong>2M</strong> rows/night with idempotent upserts.",
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
                    dates: "May 2019 – Aug 2019",
                    bullets: [
                        {
                            text: "Prototyped document search with <strong>Elasticsearch</strong>; improved internal findability for 200+ research notes.",
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
            stack: "Next.js, PostgreSQL, Stripe, Playwright",
            bullets: [
                {
                    text: "Personal finance tracker with shared budgets, receipt OCR, and household permissions.",
                },
                {
                    text: "Open-sourced import adapters for Mint and CSV banks; <strong>1.2k</strong> GitHub stars.",
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
            dates: "Aug 2016 – May 2020",
            gpa: "CGPA 3.82",
        },
    ],
} as const satisfies Record<string, unknown>;
