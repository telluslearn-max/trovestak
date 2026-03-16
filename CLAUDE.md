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

### Modus Operandi — apply to every task

```
/feature load [name]
  → Update current-feature.md with task + context
  → Create branch: feature/<name> or fix/<name>

/feature start
  → Implement the change

/feature test
  → Manual browser test or tsc type-check
  → If NEEDS WORK → iterate until passing

/feature review
  → Run code review checklist (below)
  → If NEEDS WORK → iterate until passing
  → Commit (Co-Authored-By), push

/feature done
  → Mark completed in current-feature.md
  → Start next task only after this step
```

**The NEEDS WORK loop is not optional.** Every task cycles through test → review → iterate until both pass. Never commit code that has failed either gate.

### Code review checklist (run before every commit)

- [ ] File/component structure clean
- [ ] State management correct (Zustand / useState / server action — right tool for scope)
- [ ] No unused imports or dead code
- [ ] Problem solved correctly — no wrong assumptions about schema or API shape
- [ ] Dependencies correct and specified
- [ ] No over-engineering (no abstraction for a single use-case)
- [ ] Security: no secrets logged, user input validated at boundaries
- [ ] Error handling: async errors caught, nothing silently swallowed

### Context files (do not delete)

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project overview + coding standards + this workflow |
| `current-feature.md` | Active task — updated at start and end of every feature |
| `ideas/TROVESTAK_AI_BIBLE.md` | Canonical product spec (1171 lines) |
| `C:\Users\Administrator\.claude\plans\foamy-weaving-yao.md` | Admin dashboard implementation plan |

### Rules

- **Be explicit about scope.** Tell me exactly what to change and what to leave alone.
- **One task at a time.** Don't start the next task until the current one is committed.
- **Never guess column names or API shapes** — read the actual schema or source first.
- **Each workstream runs on its own branch.** Admin dashboard → `feature/admin-dashboard`. Never commit admin work to `main` directly.
- **Supabase is the canonical DB.** All services connect to `lgxqlgyciazmlllowhel`. No service maintains its own DB.
- **Prices are whole KES integers.** `price_kes = 75000` means KES 75,000. Never divide by 100.

---

## Current Feature

See [`current-feature.md`](./current-feature.md)
