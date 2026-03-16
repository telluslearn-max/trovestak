# Current Feature

## Active Task: Microservices Phase 1 — Extract order-service

**Status:** Planning
**Branch:** `feature/store-upgrade` (Phase 0 done here; Phase 1 needs new branch)
**Priority:** P2 — architectural hardening post-competition

### What We're Doing

Extracting order creation + fulfillment logic from storefront server actions into a dedicated `order-service` (Express/TypeScript). See `ideas/MICROSERVICES_ARCHITECTURE.md` for full spec.

### Phase 0 — Completed (2026-03-17)

| Fix | File | Status |
|-----|------|--------|
| Transcription crash | `agent-service/src/index.ts:169` | ✅ Done |
| M-Pesa amount /100 | `mpesa-service/src/index.ts:187` | ✅ Done |
| Stock decrement | `notif-service/src/index.ts` + migration `20260317000002` | ✅ Done |
| "in cents" comment | `shared/lib/events.ts:41` | ✅ Done |

---

## Completed Tasks

| Task | Branch | Date |
|------|--------|------|
| Seed pgvector embeddings | `fix/seed-embeddings` | 2026-03-15 |
| Fix WhatsApp phone number | `fix/whatsapp-number` | 2026-03-15 |
| Add CLAUDE.md + current-feature.md | `fix/whatsapp-number` | 2026-03-15 |
| Write ENGINEERING_BRIEF.md (Apple Store standard) | `fix/storefront-production` | 2026-03-16 |
| Apple Store storefront rebuild (all 22 steps) | `feature/apple-store-storefront` | 2026-03-16 |
| Admin dashboard + GCP infrastructure (all 13 steps) | `fix/storefront-production` | 2026-03-16 |
| Concierge & ML handover (all 6 steps) | `feature/store-upgrade` | 2026-03-17 |
| Phase 0 live defect fixes (transcription, M-Pesa amount, stock decrement) | `feature/store-upgrade` | 2026-03-17 |
