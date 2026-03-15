# Trovestak — AI Context

## Project Overview

**Trovestak** is a voice-first e-commerce platform for premium electronics in Kenya ("Best Buy of East Africa"). The core differentiator is **TroveVoice** — an AI shopping concierge powered by Google Gemini Live API that lets customers shop by voice and pay via M-Pesa.

**Business context:**
- Submitted to Gemini Live Agent Challenge (Devpost, $25K prize)
- Targeting real commercial launch in Kenya
- GCP Project: `trovestak` (us-central1)

**Monorepo:** Turborepo + pnpm workspaces

| App / Package | Purpose | Port |
|---------------|---------|------|
| `apps/storefront` | Next.js 15 frontend | 3000 |
| `apps/agent-service` | Gemini Live WebSocket bridge (TroveVoice) | 8088 |
| `apps/mpesa-service` | M-Pesa Daraja STK Push | 8081 |
| `apps/notif-service` | Pub/Sub event notifications | 8080 |
| `apps/ml-service` | TensorFlow recommendations | 8001 |
| `packages/shared` | Shared types, events, formatters, Supabase clients | — |

**Key files:**
- `apps/agent-service/src/tools.ts` — all 6 concierge tool implementations
- `apps/agent-service/src/agent.ts` — conciergeAgent + researchAgent definitions
- `apps/storefront/src/components/concierge/ConciergeVoice.tsx` — voice UI
- `apps/storefront/src/app/checkout/actions.ts` — M-Pesa STK Push + order creation
- `ideas/TROVESTAK_AI_BIBLE.md` — canonical product spec (1171 lines)

**Database:** Supabase (`lgxqlgyciazmlllowhel`) — PostgreSQL + pgvector (768-dim, `gemini-embedding-001`)

**Env files:** `apps/agent-service/.env`, `apps/storefront/.env.local`

---

## Coding Standards

- **Language:** TypeScript everywhere (strict mode). No `any` unless unavoidable.
- **Framework:** Next.js 15 App Router. Prefer server components; use `"use client"` only when needed.
- **Styling:** Tailwind CSS 4 + shadcn/ui. No inline styles. Use `cn()` from `@/lib/utils` for conditional classes.
- **State:** Zustand for global client state. `useState`/`useReducer` for local component state.
- **Data fetching:** Server components fetch directly. Client components use server actions.
- **Formatting:** 4-space indent. Single quotes. Semicolons. No trailing commas in function params.
- **Naming:** camelCase for variables/functions, PascalCase for components/types, SCREAMING_SNAKE for constants.
- **Imports:** Absolute paths via `@/` alias in storefront. Relative paths in services.
- **Error handling:** Always handle async errors. Never swallow errors silently — log them.
- **No over-engineering:** Don't abstract unless used 3+ times. No premature generalization.
- **No dead code:** Remove unused imports, variables, and functions.
- **Security:** Never log secrets. Validate all user input at boundaries. Use server actions for DB writes.

**DB conventions:**
- Products use `status = 'published'` (not 'active')
- Prices stored as KES whole numbers (e.g. `13000` = KES 13,000) — never divide by 100
- Product columns: `name` (not title), `nav_category` (not category)
- Embedding model: `gemini-embedding-001` via v1beta REST, `outputDimensionality: 768`

---

## AI Interaction

**How to work with me (Claude):**

- Follow the modus operandi workflow for every task:
  ```
  /feature load   → document + create branch
  /feature start  → implement
  /feature test   → test manually or TDD
  /feature review → code review checklist
                  → commit + merge + push
  /feature done   → mark complete
  ```

- **Code review checklist** (run before every commit):
  - [ ] File/component structure clean
  - [ ] State management correct
  - [ ] No unused imports or dead code
  - [ ] No over-engineering
  - [ ] Security concerns addressed
  - [ ] Error handling in place

- **Be explicit about scope.** Tell me exactly what to change and what to leave alone.
- **One task at a time.** Don't start the next task until the current one is committed.
- **`current-feature.md` is updated automatically** at the start of every task — it always reflects what's in progress.
- **Never guess column names or API shapes** — check the actual schema or source first.

---

## Current Feature

See [`current-feature.md`](./current-feature.md)
