# Current Feature

## Active Task: Admin Dashboard — Full Implementation

**Status:** In Progress
**Branch:** `feature/admin-dashboard`
**Priority:** P0 — Devpost demo + commercial launch

### Scope

Build the entire admin dashboard from stubs to fully functional operations center. Supabase-backed, event-driven microservices on GCP. Modus operandi applied to every step.

### Implementation Steps

| # | Step | Status |
|---|------|--------|
| 0 | DB cleanup migration | ⏳ In progress |
| 1 | Update CLAUDE.md with full modus workflow | Pending |
| 2 | Port ProductNew.jsx → product-form.tsx | Pending |
| 3 | orders/fulfillment — dispatch queue | Pending |
| 4 | finance/reconciliation + finance/actions.ts | Pending |
| 5 | finance/transactions + finance/invoices | Pending |
| 6 | marketing/promotions (discount codes) | Pending |
| 7 | marketing/flash-sales | Pending |
| 8 | marketing/seo bulk editor | Pending |
| 9 | marketing/email campaigns | Pending |
| 10 | analytics/traffic — Kenya delivery heatmap | Pending |
| 11 | shipping/zones + rates | Pending |
| 12 | inventory/alerts — stock alerts | Pending |
| 13 | inventory/trade-ins — valuations + intake | Pending |
| 14 | Dashboard enhancements (bell + map card) | Pending |
| 15 | GCP: Pub/Sub topics + fulfillment-service + Cloud Scheduler | Pending |

### Architecture

- **DB:** Supabase (`lgxqlgyciazmlllowhel`) — canonical store for all services
- **Events:** Cloud Pub/Sub (existing + new topics: order.dispatched, order.delivered, stock.low, email.campaign)
- **New service:** `apps/fulfillment-service/` (Cloud Run, mirrors notif-service)
- **Analytics:** BigQuery additive-only, not replacing Supabase

### How to Run

```bash
cd apps/storefront && pnpm dev   # localhost:3000
# Admin at localhost:3000/admin
```

---

## Completed Tasks

| Task | Branch | Date |
|------|--------|------|
| Seed pgvector embeddings | `fix/seed-embeddings` | 2026-03-15 |
| Fix WhatsApp phone number | `fix/whatsapp-number` | 2026-03-15 |
| Add CLAUDE.md + current-feature.md | `fix/whatsapp-number` | 2026-03-15 |
