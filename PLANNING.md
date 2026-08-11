# YourUnique.cv — Planning

Chat-based resume product: users store a career profile, paste a job description, and an agent drafts + compiles a tailored PDF. Evolves from the existing portfolio MCP resume workflow into a multi-user product.

## Product shape

```
User profile + JD + chat memory
        │
        ▼
Mastra agent + tools (get/update profile, analyze JD, draft sections)
        │
        ▼
Trigger.dev job (compile PDF, email, version history)
        │
        ▼
PDF download + history
```

Same tools can later be exposed as an MCP server for IDE agents.

## Stack (decided)

| Layer | Choice | Notes |
|---|---|---|
| App | Next.js (App Router) + TypeScript | Monolith on Vercel |
| UI | Tailwind + **shadcn/ui** (`base-nova`) + AI Elements | Streaming chat, tool call UI. shadcn init done. |
| AI | Mastra (agents, tools, workflows, memory) | TS-first; Studio for debugging |
| Streaming | Vercel AI SDK + `@mastra/ai-sdk` | `useChat` ↔ Mastra |
| Models | OpenRouter (or Vercel AI Gateway) | Multi-model + cost control |
| DB | Neon Postgres + Drizzle (+ pgvector later) | Profiles, docs, threads.
| Auth | **Clerk** (`@clerk/nextjs` v7) | `proxy.ts` + `Show`/`UserButton`; sign-in/up at `/sign-in`, `/sign-up`; app under `(app)` route group (`/new-chat`, …) |
| Jobs | **Trigger.dev** | PDF, email, long tailor pipelines |
| PDF | **Typst** (CLI in Trigger.dev worker) | Agent writes structured JSON (`source_json`); app renders Typst from [basic-resume](https://github.com/stuxf/basic-typst-resume-template) helpers at compile time |
| Email | **Resend** | From Trigger.dev tasks — no mail server on Vercel |
| Payments | **Dodo Payments** | Metered/credits; continuity with SocialSonar billing experience |
| Observability | Mastra Studio + Langfuse/Helicone | Token cost, latency |
| Agent surface | MCP (productize existing resume MCP) | Same tools as in-app agent |

## Architecture decisions

- **Next.js monolith on Vercel** for UI, auth, DB, streaming chat — no separate Nest/Express backend for v1.
- **No Inngest** — Trigger.dev wins on price (Free → Hobby $10 vs Inngest Pro $99) and on running Typst outside Vercel serverless limits.
- **Rejected for v1:** SST + SQS + Lambda (valid later if cost/AWS ownership matters; more ops). CopilotKit (AI Elements is enough). Separate FastAPI/Nest service.
- **Speed:** streaming chat hides LLM latency; PDF compile is async via Trigger.dev (never block the chat request).
- **LangGraph stays on the resume as SocialSonar production work** — Mastra is the TS product/agent story for this app.

## Build order

1. Next.js + Mastra agent with core tools (`get_profile`, `analyze_jd`, `draft_sections`)
2. AI Elements chat with visible tool calls
3. Structured profile schema (Drizzle + Neon)
4. Trigger.dev: Typst compile → PDF download
5. Clerk auth + Dodo Payments credits
6. Resend email on job complete
7. Productize MCP with the same tools

## Explicitly out of scope (v1)

- Separate backend service
- Inngest
- SST/SQS/Lambda workers
- CopilotKit / AG-UI
- Better Auth (Clerk chosen instead)
- Stripe (Dodo Payments chosen instead)
- Browser-only Typst WASM as the only PDF path (optional for preview later)
