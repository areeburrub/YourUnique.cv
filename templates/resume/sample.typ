#import "lib.typ": *

#show: resume.with(
    author: "Areeb ur Rub",
    email: "areeburrub@gmail.com",
    github: "github.com/areeburrub",
    linkedin: "linkedin.com/in/areeburrub",
    phone: "+91-954-6557-824",
    personal-site: "areeburrub.dev",
    location: "Bangalore, India",
    accent-color: "#000080",
    paper: "a4",
    author-position: left,
    personal-info-position: left,
)

== Executive Summary
#block(above: 0pt, below: 0pt)[
    #set par(leading: 0.5em)
    #("Founding engineer with production experience building Python backend services, LLM workflows, data pipelines, and cloud infrastructure for a social listening and media monitoring platform. Shipped AI features used to process tens of thousands of posts daily and 100,000+ mentions per week, with LangChain, LangGraph, FastAPI, PostgreSQL, Redis, BullMQ, and LangSmith. Has owned architecture, reliability, observability, cost reduction, and product delivery in an early-stage team.")
]

== Work Experience
#company-header("SocialSonar (formerly Tapti AI)", url: "https://socialsonar.ai")
#role-entry(
    title: "Founding Engineer",
    location: "Bangalore, India / Remote",
    employment: "Full-time",
    dates: dates-helper(start-date: "Aug 2025", end-date: "Present"),
)[
    - *LLM Systems:* #("Built LangChain and LangGraph workflows across OpenAI, Anthropic, Gemini, Fireworks, and OpenRouter to process and enrich incoming social and news data.")
    - *AI Product:* #("Built an AI Digest workflow that scores and filters content across multiple parameters, then generates a daily PDF and emails it to users.")
    - *Reliability:* #("Built Riva, a ReAct-style agent with multiple tools and a supervisor/router pattern, and used LangSmith to observe, debug, evaluate, and optimize production agent workflows.")
    - *Scale:* #("Maintained collectors across 8+ social platforms and thousands of news sites, ingesting tens of thousands of posts daily and processing 100,000+ mentions per week.")
    - *Efficiency:* #("Added model routing, semantic-search context filtering, and task-specific workflows, reducing LLM inference costs by approximately 40% compared with a large-context call.")
    - *Data Quality:* #("Built analytics and evaluation workflows with HDBSCAN, scikit-learn, pandas, and NumPy, reducing bad-data incidents by approximately 30%.")
    - *Workflows:* #("Designed event-driven, multi-step scraping workflows with BullMQ and Redis, handling proxy rotation, CAPTCHA challenges, GraphQL, and mobile API integrations.")
    - *Platform:* #("Designed usage-based billing with PostgreSQL, Redis, BullMQ, and Dodo Payments webhooks; managed observability with Prometheus, Grafana, Loki, and Sentry.")
]
#role-entry(
    title: "Full Stack Developer Intern",
    location: "Bangalore, India / Remote",
    employment: "Internship",
    dates: dates-helper(start-date: "Nov 2024", end-date: "Jul 2025"),
)[
    - *Backend:* #("Built NestJS APIs with PostgreSQL, Prisma, and Zod validation, then added Python and Playwright collectors for the first social media integrations.")
    - *Product:* #("Worked with the founding team through product changes and pivots that led to the current social listening platform.")
    - *Mentoring:* #("Helped onboard new interns as the team grew and contributed shared internal TypeScript packages.")
]
#v(2pt)
#company-header("Freelance")
#role-entry(
    title: "Web Developer",
    location: "Remote",
    employment: "Contract",
    dates: dates-helper(start-date: "Nov 2022", end-date: "Jul 2024"),
)[
    - *Delivery:* #("Delivered production websites end to end, from requirements and implementation through cross-browser QA, deployment, and direct client communication.")
]

== Skills
#block(above: 0pt, below: 0pt)[
    - *Languages:* #("Python, TypeScript, JavaScript, SQL")
    - *Backend:* #("FastAPI, NestJS, Hono, Pydantic, Zod")
    - *AI/LLM:* #("LangChain, LangGraph, OpenAI, Anthropic, Gemini, Fireworks, OpenRouter, LangSmith")
    - *Data Stores:* #("PostgreSQL, MongoDB, Redis, Milvus, pgvector, DynamoDB")
    - *Workflows:* #("BullMQ, AWS Step Functions, AWS SQS, event-driven systems")
    - *Reliability:* #("Prometheus, Grafana, Loki, Sentry, New Relic, CI/CD, production system design")
    - *Infrastructure:* #("Docker, Kubernetes/K3s, Helm, Argo CD, Terraform, AWS, Cloudflare Workers")
]

== Projects
#project(
    name: "Drized",
    url: "drized.com",
)
#pad(left: 0.05in, bottom: 2pt)[
    #set list(spacing: 0.55em, tight: true)
    #set par(leading: 0.38em)
    - *Stack:* #("Next.js, AWS, Google image-generation APIs")
    - *AI Product:* #("Built a virtual try-on product with Next.js and AWS, including e-commerce scrapers, a product catalog, Google image-generation APIs, and credit payments.")
    - Links: #link("https://drized.com")[#("Website")], #link("https://github.com/areeburrub/drized")[#("GitHub")]
]
#v(2pt)
#project(
    name: "Stash-or-Pass",
    url: "stash-or-pass.com",
)
#pad(left: 0.05in, bottom: 2pt)[
    #set list(spacing: 0.55em, tight: true)
    #set par(leading: 0.38em)
    - *Stack:* #("Next.js, TypeScript, PostgreSQL")
    - *Recommendations:* #("Built a swipe-based portfolio discovery app with personalized recommendations and a public leaderboard; seeded the catalog with 1,800+ portfolios and reached 80 Product Hunt upvotes on launch day.")
    - Links: #link("https://stash-or-pass.com")[#("Website")], #link("https://www.producthunt.com/products/stash-or-pass")[#("Product Hunt")]
]

== Education
#block(above: 0pt, below: 0pt)[
    #edu(
        institution: "Galgotias College of Engineering and Technology",
        location: "Greater Noida, India",
        dates: dates-helper(start-date: "Nov 2021", end-date: "Jul 2025"),
        degree: "B.Tech. in Computer Science and Engineering (Artificial Intelligence); CGPA: 7.41",
        consistent: true,
    )
]
