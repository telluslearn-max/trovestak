# Current Feature

## Active Task: Admin Dashboard + GCP Infrastructure

**Status:** Complete — ready for review
**Branch:** `fix/storefront-production`
**Priority:** P1 — Operations readiness

### What We Built

Full admin panel implementation (13 steps) and GCP Pub/Sub + Cloud Scheduler infrastructure.

### Step Progress

| Step | Description | Status |
|------|-------------|--------|
| 1 | Create branch + update current-feature.md | ✅ Done |
| 2 | DB cleanup migration | ✅ Done |
| 3 | Update CLAUDE.md with modus workflow | ✅ Done |
| 4 | Port ProductNew.jsx → product-form.tsx | ✅ Done |
| 5 | orders/fulfillment — dispatch queue | ✅ Done |
| 6 | finance/reconciliation + finance/actions.ts | ✅ Done |
| 7 | finance/transactions + finance/invoices | ✅ Done |
| 8 | marketing/actions.ts + promotions + flash-sales | ✅ Done |
| 9 | analytics/traffic — Kenya county heatmap | ✅ Done |
| 10 | shipping/zones | ✅ Done |
| 11 | inventory/alerts + inventory/trade-ins | ✅ Done |
| 12 | admin/page.tsx — order bell + delivery counties | ✅ Done |
| 13 | GCP Pub/Sub topics + Cloud Scheduler | ✅ Done |

### Key Files

- `apps/storefront/src/app/admin/orders/fulfillment/` — Dispatch queue + rider assignment
- `apps/storefront/src/app/admin/finance/` — Reconciliation, transactions, invoices
- `apps/storefront/src/app/admin/marketing/` — Promotions + flash sales
- `apps/storefront/src/app/admin/analytics/traffic/` — Kenya county delivery heatmap
- `apps/storefront/src/app/admin/shipping/zones/` — Shipping zones + rates
- `apps/storefront/src/app/admin/inventory/` — Stock alerts + trade-ins
- `apps/storefront/src/app/admin/page.tsx` — Dashboard with action bell + heatmap
- `packages/shared/lib/events.js` — Added ORDER_DISPATCHED topic
- `apps/notif-service/src/index.ts` — ORDER_DISPATCHED handler + 3 scheduled job endpoints
- `infra/pubsub-topics.yaml` — All topics + subscriptions spec
- `infra/setup-pubsub.sh` — One-shot GCP Pub/Sub provisioning script
- `infra/scheduler-jobs.yaml` — Cloud Scheduler jobs spec
- `infra/setup-scheduler.sh` — One-shot Cloud Scheduler provisioning script
- `supabase/migrations/20260316000001_fulfillment_riders.sql`
- `supabase/migrations/20260316000002_marketing_tables.sql`
- `supabase/migrations/20260316000003_shipping_zones.sql`
- `supabase/migrations/20260316000004_trade_ins.sql`

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
