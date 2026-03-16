# Current Feature

## Active Task: Microservices Migration — Complete

**Status:** All phases done ✅
**Branch:** `feature/store-upgrade`
**Priority:** P2 — architectural hardening post-competition

---

## Completed Phases

### Phase 0 — Live defect fixes (2026-03-17) ✅

| Fix | File | Status |
|-----|------|--------|
| Transcription crash | `agent-service/src/index.ts:169` | ✅ Done |
| M-Pesa amount /100 | `mpesa-service/src/index.ts:187` | ✅ Done |
| Stock decrement | `notif-service/src/index.ts` + migration `20260317000002` | ✅ Done |
| "in cents" comment | `shared/lib/events.ts:41` | ✅ Done |

### Phase 1 — Extract order-service (2026-03-17) ✅

- `apps/order-service/` created (Express/TS, port 8082)
- 13 REST endpoints: checkout, fulfillment, cart validation, shipping rates, discount codes
- Subscribes to `payment.confirmed` / `payment.failed` Pub/Sub
- Publishes `order.created`, `payment.initiate`, `order.dispatched`, `order.updated`
- Storefront checkout + admin order actions → thin HTTP dispatchers

### Phase 2 — Extract catalog-service (2026-03-17) ✅

- `apps/catalog-service/` created (Express/TS, port 8083)
- 65+ REST endpoints: products, variants, relations, attributes, templates, bundles, marketing, brands, categories, suppliers, trade-ins
- Subscribes to `order.created` → stock decrement (replaced notif-service temp fix)
- Publishes `stock.updated` (after decrement), `product.import` (after bulk upsert)
- 9 storefront admin action files → thin HTTP dispatchers

### Phase 3 — API Gateway (2026-03-17) ✅

- `apps/gateway/` created (nginx, port 8080)
- `limit_req_zone` rate limiting: payment=5r/m, admin=60r/m, general=300r/m
- WebSocket upgrade support for agent-service
- `X-Request-ID` injection for distributed tracing
- Env-var-driven upstream config (envsubst at container start)

### Phase 4 — Activate unused Pub/Sub topics (2026-03-17) ✅

| Topic | Producer | Consumer | Status |
|-------|----------|----------|--------|
| `order.updated` | order-service (on status change) | notif-service (SMS) | ✅ Active |
| `agent.intent` | agent-service/tools.ts (search_products) | ml-service | ✅ Active |
| `product.import` | catalog-service (/products/bulk/upsert) | ml-service | ✅ Active |
| `stock.updated` | catalog-service (handleOrderCreated) | ml-service | ✅ Active |
| `recommendation.ready` | ml-service (/recommend endpoint) | agent-service | ✅ Active |

All new subscriptions added to `infra/pubsub-topics.yaml` and `infra/setup-pubsub.sh`.

### Phase 5 — notif-service real delivery + cleanup (2026-03-17) ✅

- Resend email: order confirmation on `order.created`
- Africa's Talking SMS: payment confirmed, order dispatched, order status updates
- `initiateCheckoutTool` in agent-service → calls order-service `POST /orders` (not mpesa-service)
- `infra/setup-pubsub.sh` updated with all 6 new subscriptions from Phase 2-5
- `africastalking.d.ts` module declaration added (no published types)
- `normalizePhone` from shared package wired into SMS sender

---

## Completed Tasks (pre-migration)

| Task | Branch | Date |
|------|--------|------|
| Seed pgvector embeddings | `fix/seed-embeddings` | 2026-03-15 |
| Fix WhatsApp phone number | `fix/whatsapp-number` | 2026-03-15 |
| Add CLAUDE.md + current-feature.md | `fix/whatsapp-number` | 2026-03-15 |
| Write ENGINEERING_BRIEF.md (Apple Store standard) | `fix/storefront-production` | 2026-03-16 |
| Apple Store storefront rebuild (all 22 steps) | `feature/apple-store-storefront` | 2026-03-16 |
| Admin dashboard + GCP infrastructure (all 13 steps) | `fix/storefront-production` | 2026-03-16 |
| Concierge & ML handover (all 6 steps) | `feature/store-upgrade` | 2026-03-17 |
| Phase 0 live defect fixes | `feature/store-upgrade` | 2026-03-17 |
| Phase 1 — order-service extraction | `feature/store-upgrade` | 2026-03-17 |
| Phase 2 — catalog-service extraction | `feature/store-upgrade` | 2026-03-17 |
| Phase 3 — API gateway (nginx) | `feature/store-upgrade` | 2026-03-17 |
| Phase 4 — activate unused Pub/Sub topics | `feature/store-upgrade` | 2026-03-17 |
| Phase 5 — notif-service delivery + final wiring | `feature/store-upgrade` | 2026-03-17 |
