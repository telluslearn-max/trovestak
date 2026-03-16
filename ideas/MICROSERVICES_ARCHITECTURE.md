# Trovestak: Event-Driven Microservices Architecture

> **Handover document for the next agent.**
> This is a design spec, not an implementation task. Read this before touching any service boundaries, event schemas, or inter-service communication.

---

## Project Context

**Trovestak** is a voice-first e-commerce platform for Kenya ("Best Buy of East Africa"). Core differentiator: TroveVoice — a Gemini Live voice shopping concierge with M-Pesa checkout.

- **GCP Project:** `trovestak` (us-central1)
- **Database:** Supabase `lgxqlgyciazmlllowhel` — PostgreSQL + pgvector (768-dim)
- **Monorepo:** Turborepo + pnpm workspaces
- **Deployment:** Each service = one Cloud Run service

---

## Current State: The Core Problem

The project already has the right microservices structure on paper. The problem is that **the storefront is doing the work of three services**. The `apps/storefront` Next.js app currently:

- Creates orders and order items (should be `order-service`)
- Publishes `order.created` and `payment.initiate` Pub/Sub events (should be `order-service`)
- Manages the dispatch/fulfillment workflow (should be `order-service`)
- Handles all product catalog CRUD (should be `catalog-service`)
- Manages inventory, bundles, suppliers, pricing (should be `catalog-service`)

Additionally:

| Defect | Location | Severity |
|--------|----------|----------|
| In-memory rate limiter | `apps/storefront/src/lib/rate-limit.ts` — uses `new Map()`, resets on Cloud Run cold start | **Critical** — payment endpoint unprotected at scale |
| Amount encoding bug | `apps/mpesa-service/src/index.ts:188` — divides `total_amount / 100` but prices are whole KES integers | **Critical** — M-Pesa charges wrong amounts |
| Transcription null crash | `apps/agent-service/src/index.ts` — `inputTranscription.text` accessed on a string | **High** — silent voice transcription failures |
| Stock never decremented | No service consumes `order.created` to reduce `stock_quantity` | **High** — live inventory divergence |
| 5 topics wired to nothing | `order.updated`, `stock.updated`, `agent.intent`, `recommendation.ready`, `product.import` declared but no producers/consumers | Medium |

---

## Coding Standards (from CLAUDE.md)

- **TypeScript strict mode everywhere.** No `any` unless unavoidable.
- **Prices are whole KES integers.** `price_kes = 75000` = KES 75,000. Never divide by 100.
- **Products use `status = 'published'`** (not 'active').
- **Product columns:** `name` (not title), `nav_category` (not category).
- **4-space indent, single quotes, semicolons.**
- **Never log secrets. Validate all user input at boundaries.**

---

## Target Architecture

### System Diagram

```
INTERNET / CLIENTS
  Browser (Next.js)    Mobile (future)    WhatsApp webhook
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              API GATEWAY (nginx on Cloud Run)            │
│   Rate limiting · JWT validation · Route dispatch       │
└────────┬────────────────────┬────────────────┬──────────┘
         │                    │                │
  ┌──────▼──────┐    ┌─────────▼──────┐  ┌────▼──────────┐
  │ storefront  │    │  order-service │  │ agent-service │
  │ Next.js 15  │    │  Express/TS    │  │ WS + Gemini   │
  │ (UI ONLY)   │    │  Port 8082     │  │ Live :8088    │
  └──────┬──────┘    └─────────┬──────┘  └────┬──────────┘
         │ SSR reads           │               │ REST →
         │ direct Supabase     │        ┌──────▼──────────┐
         │                    │        │ catalog-service  │
         │                    │        │ Express/TS :8083 │
         │                    │        └──────────────────┘
         │             ┌──────▼──────────────────────────┐
         │             │       GCP PUB/SUB EVENT BUS      │
         │             │                                  │
         │             │  order.created   order.updated   │
         │             │  order.dispatched                │
         │             │  payment.initiate                │
         │             │  payment.confirmed               │
         │             │  payment.failed                  │
         │             │  stock.low       stock.updated   │
         │             │  agent.intent                    │
         │             │  recommendation.ready            │
         │             │  product.import                  │
         │             └──┬───────────┬──────────┬────────┘
         │                │           │          │
  ┌──────▼───┐  ┌──────────▼──┐  ┌────▼───┐  ┌──▼──────┐
  │  mpesa   │  │    notif    │  │   ml   │  │catalog  │
  │ service  │  │   service   │  │  svc   │  │ service │
  │  :8081   │  │    :8080    │  │ :8001  │  │  :8083  │
  └──────────┘  └─────────────┘  └────────┘  └─────────┘
                                                   │
         ┌─────────────────────────────────────────┘
         ▼
  SUPABASE (lgxqlgyciazmlllowhel)
  PostgreSQL + pgvector + RLS
  Single canonical database — no database-per-service
```

---

## Service Definitions

### 1. storefront — Next.js 15 (thinned)

**Becomes:** Pure rendering and UX layer. No DB writes. No business logic.

**Loses** (extracted to services below):
- `src/app/checkout/actions.ts` → order-service
- `src/app/admin/orders/fulfillment/fulfillment-actions.ts` → order-service
- `src/app/admin/products/actions.ts` (650 lines) → catalog-service
- `src/app/admin/inventory/` actions → catalog-service
- `src/app/admin/bundles/actions.ts` → catalog-service
- `src/lib/rate-limit.ts` → API gateway

**Keeps:**
- Next.js App Router, Tailwind CSS 4, shadcn/ui, Framer Motion
- Read-only Supabase queries for SSR (product pages, category, search — bypass service for performance)
- Auth via Supabase (session cookies, middleware)
- `src/components/concierge/ConciergeVoice.tsx` — WebSocket client to agent-service
- Admin UI pages — but calling service REST APIs, not doing DB writes
- Server actions become thin HTTP dispatchers (~20 lines each, no DB logic)

**After migration, checkout/actions.ts looks like:**
```typescript
export async function initiateMpesaStkAction(payload: CheckoutPayload) {
    const res = await fetch(`${process.env.ORDER_SERVICE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await getServerSession()}` },
        body: JSON.stringify(payload),
    });
    return res.json(); // { order_id, status }
}
```

---

### 2. order-service (NEW)

**Extracted from:**
- `apps/storefront/src/app/checkout/actions.ts`
- `apps/storefront/src/app/admin/orders/fulfillment/fulfillment-actions.ts`
- `apps/storefront/src/app/admin/orders/actions.ts`

**Domain ownership:** Orders, fulfillment workflow, discount validation, shipping rates, rider assignment.

**Data tables it owns (writes):** `orders`, `order_items`, `riders`
**Data tables it reads:** `products`, `product_variants`, `shipping_zones`, `shipping_rates`, `discount_codes`

**REST API:**
```
POST   /orders                     — validate cart, create order, publish payment.initiate + order.created
GET    /orders/:id                 — order status (storefront polls this for M-Pesa confirmation)
PATCH  /orders/:id/status          — admin: manual status update
POST   /orders/:id/assign-rider    — admin: assign delivery rider
POST   /orders/:id/dispatch        — admin: mark shipped, publish order.dispatched
GET    /orders/fulfillment-queue   — admin: paid orders in processing/packing
POST   /cart/validate              — stock availability + price drift check
GET    /shipping/rate/:county      — shipping rate for checkout
```

**Events produced:**
- `order.created` — after successful order insert
- `payment.initiate` — triggers mpesa-service STK Push
- `order.dispatched` — after admin marks dispatched (triggers customer SMS)
- `order.updated` — on every status transition

**Events consumed:**
- `payment.confirmed` — update `orders.payment_status = 'paid'`
- `payment.failed` — update `orders.payment_status = 'failed'`

**Why sync (REST) for order creation:** The checkout UI needs a synchronous response with the order ID before showing confirmation. The service creates the DB record synchronously, then fires async events to downstream consumers.

**Implementation notes:**
- Copy business logic verbatim from `checkout/actions.ts` and `fulfillment-actions.ts`
- Use `@trovestak/shared` for event contracts, logger, Supabase client
- Add idempotency key (order ID) to prevent duplicate order creation on retries
- Port `ensureAdmin` guard to service-level middleware for admin routes

---

### 3. catalog-service (NEW)

**Extracted from:**
- `apps/storefront/src/app/admin/products/actions.ts` (650 lines)
- `apps/storefront/src/app/admin/inventory/` (alerts, trade-ins, stock updates)
- `apps/storefront/src/app/admin/bundles/actions.ts`
- `apps/storefront/src/app/admin/marketing/actions.ts`
- `apps/storefront/src/app/admin/brands/`, `categories/`, `suppliers/` actions

**Domain ownership:** Products, inventory, categories, brands, bundles, suppliers, discount codes, flash sales.

**Data tables it owns (writes):** `products`, `product_variants`, `product_pricing`, `product_specs`, `product_content`, `product_addons`, `product_categories`, `product_attribute_groups`, `product_attribute_terms`, `product_relation`, `suppliers`, `bundles`, `bundle_items`, `bundle_slots`, `bundle_slot_options`, `discount_codes`, `flash_sales`, `trade_ins`
**Data tables it reads:** `orders` (for analytics only)

**REST API (selected):**
```
GET    /products                   — admin product list with filters
GET    /products/:id               — full product admin detail
POST   /products                   — create product
PUT    /products/:id               — update product
DELETE /products/:id               — delete product
POST   /products/bulk/prices       — bulk price update (percentage or fixed)
POST   /products/bulk/import       — CSV import → publish product.import event
GET    /inventory/alerts           — low stock variants
PATCH  /inventory/:variantId       — update stock quantity → publish stock.updated
```

**Events produced:**
- `stock.low` — when variant stock drops below `low_stock_threshold`
- `stock.updated` — when stock changes (sale or restock)
- `product.import` — after bulk import (triggers ml-service re-embedding)

**Events consumed:**
- `order.created` — **decrement stock** for each ordered variant (this currently happens nowhere — live inventory divergence bug)

**Important note on storefront SSR:** Read-only catalog queries from the storefront (product pages, category pages, search) should **bypass catalog-service** and query Supabase directly. This keeps SSR fast and avoids a network hop on every page render. Only mutations (admin creates/updates/deletes) go through catalog-service.

---

### 4. mpesa-service (existing — two fixes needed)

**File:** `apps/mpesa-service/src/index.ts`

**What stays:**
- Consumes `payment.initiate` via Pub/Sub
- Calls Daraja API (Safaricom sandbox/production)
- Handles `POST /callback/mpesa` from Safaricom
- Publishes `payment.confirmed` / `payment.failed`

**What changes:**
1. **Fix amount encoding bug at line 188:** `amount: order.total_amount / 100` — remove the `/100`. Prices are whole KES integers already. This sends KES 750 instead of KES 75,000 for a KES 75,000 item.
2. **Remove `/local/payment-initiate` fallback** — in the new architecture, dev/test falls back through order-service, not directly to mpesa-service.
3. **Consider:** Rather than mpesa-service writing `orders.payment_status` directly, publish a richer `payment.confirmed` event and let order-service update its own table when it receives the event. This enforces the "each service owns its domain tables" rule.

---

### 5. notif-service (existing — wire actual providers)

**File:** `apps/notif-service/src/index.ts`

**What stays:** All subscriptions and Cloud Scheduler job endpoints. Architecture is correct.

**What changes — implement actual delivery:**
- `handleOrderCreated` → wire Resend API for order confirmation email
- `handlePaymentConfirmed` → wire Africa's Talking for payment receipt SMS
- `handleOrderDispatched` → wire Africa's Talking for dispatch notification SMS
- Add `order.updated` subscription → send order status update SMS
- All Kenya phone numbers: use `normalizePhone()` from `@trovestak/shared` (already handles +254 format)

**Cloud Scheduler jobs stay here** (`/jobs/stock-alerts`, `/jobs/revenue-digest`, `/jobs/mpesa-reconcile`) — scheduled notifications are a notification-domain concern.

---

### 6. agent-service (existing — gains event integration)

**File:** `apps/agent-service/src/index.ts`

**What stays:** The core Gemini Live BIDI WebSocket loop is untouched. Real-time audio streaming cannot go through an event bus.

**What changes:**
1. **Fix transcription null crash:** `inputTranscription` is assigned as a string in one code path, then `.text` is accessed on it. Causes silent undefined in voice relay.
2. **`initiateCheckoutTool`:** Currently calls mpesa-service HTTP directly. Redirect to order-service `POST /orders` instead. Agent no longer has a direct dependency on mpesa-service.
3. **Wire `agent.intent` publish:** When a user expresses a clear purchase intent ("I want to buy..."), publish `agent.intent` event fire-and-forget (non-blocking). ml-service uses these for behavioral signals.
4. **Subscribe to `recommendation.ready`:** ml-service can pre-warm recommendations per session. Agent caches and injects into tool responses.

**Communication summary:**
- Inbound: WebSocket from browser (`NEXT_PUBLIC_AGENT_WS_URL`)
- Outbound sync: HTTP to catalog-service (product search), HTTP to order-service (checkout)
- Outbound async: Pub/Sub `agent.intent` (fire-and-forget, not hot path)

---

### 7. ml-service (existing — cleaner intake)

**File:** `apps/ml-service/src/main.py`

**What changes:**
- Add `stock.updated` subscription to invalidate/refresh recommendations for restocked products
- `agent.intent` subscription (already declared in pubsub-topics.yaml) provides real-time behavioral signals without session coupling

**Stays the same:** TensorFlow recommendation model, `POST /recommend` HTTP endpoint, `order.created` consumption for training signal.

---

### 8. API Gateway (NEW)

**Why it exists:** Currently there is no gateway. Services are called directly by the storefront using env-var URLs. The in-memory rate limiter in `rate-limit.ts` is per-instance and resets on Cloud Run cold starts — it cannot protect the payment endpoint under autoscaling.

**Implementation:** nginx Cloud Run container with static `nginx.conf`.

**What it does:**
- `limit_req_zone` for rate limiting across all Cloud Run instances (fixes the `new Map()` defect)
- Supabase JWT validation middleware before forwarding to internal services
- Admin routes require additional role validation at the gateway level
- Services accessible only within VPC; gateway is the only public endpoint
- `X-Request-ID` header injection for distributed tracing

**Route config (sketch):**
```nginx
location /api/orders/    { proxy_pass http://order-service.internal; }
location /api/catalog/   { proxy_pass http://catalog-service.internal; }
location /api/agent/     { proxy_pass http://agent-service.internal; }
location /               { proxy_pass http://storefront.internal; }
```

---

## Event Topology (Complete)

| Topic | Producer | Consumers | Current Status |
|-------|----------|-----------|----------------|
| `order.created` | order-service | notif-service, ml-service, catalog-service (stock decrement) | Active — wrong producer (storefront) |
| `order.updated` | order-service | notif-service | Declared, unused |
| `order.dispatched` | order-service | notif-service | Active — wrong producer (storefront) |
| `payment.initiate` | order-service | mpesa-service | Active — wrong producer (storefront) |
| `payment.confirmed` | mpesa-service | notif-service, order-service | Active |
| `payment.failed` | mpesa-service | notif-service, order-service | Active |
| `stock.low` | catalog-service + notif-service (scheduled) | notif-service | Active (notif-service scheduled job) |
| `stock.updated` | catalog-service | ml-service | Declared, unused |
| `agent.intent` | agent-service | ml-service | Declared, unused |
| `recommendation.ready` | ml-service | agent-service | Declared, unused |
| `product.import` | catalog-service | ml-service | Declared, unused |

**Single source of truth for topic names:** `packages/shared/lib/events.js` (`TOPICS` constant). Never hardcode topic strings.

**Event envelope format (all events):**
```typescript
{
    id: string;         // crypto.randomUUID()
    topic: string;      // from TOPICS constant
    timestamp: string;  // ISO 8601
    source: string;     // producing service name
    version: "1.0";
    data: T;            // topic-specific payload
}
```
Use `createEvent(topic, source, data)` from `@trovestak/shared`.

---

## Data Ownership

**Decision: Keep single Supabase.** Reasons:
1. pgvector catalog search requires all product data in one DB
2. Pre-launch complexity budget — distributed transactions require saga patterns
3. Supabase RLS already enforces data boundaries at the DB level

**The rule:** Each service only writes to its domain tables. Cross-domain state changes via Pub/Sub events.

| Service | Writes | Reads only |
|---------|--------|-----------|
| order-service | `orders`, `order_items`, `riders` | `products`, `product_variants`, `shipping_zones`, `discount_codes` |
| catalog-service | `products`, `product_variants`, `product_*`, `suppliers`, `bundles`, `discount_codes`, `flash_sales`, `trade_ins` | `orders` (analytics) |
| mpesa-service | `orders.payment_status`, `orders.mpesa_*` columns | `orders` |
| notif-service | `notification_logs` (new table) | `orders`, `products` |
| ml-service | `product_recommendations` (new table) | `products`, `orders`, `user_preferences` |
| agent-service | `user_preferences`, `concierge_sessions` | `products`, `orders` |

---

## packages/shared — Restructure (Not Split)

**Decision: Stay monorepo.** Cloud Run deploys per-service regardless of repo structure. Turborepo already handles independent pipelines per service. Splitting to polyrepo adds overhead without benefit at this stage.

**Restructure into 3 layers:**

| Layer | Files | Rule |
|-------|-------|------|
| **Event contracts** (cross-service boundary) | `events.js`, `commerce-types.js` | Only these should cross service boundaries. Publishable as `@trovestak/contracts` if polyrepo later |
| **Infrastructure utilities** (monorepo-internal) | `publisher.js`, `supabase.js`, `logger.js`, `env.js` | Stay in shared — tooling helpers |
| **Business utilities** (in wrong place) | `daraja.js`, `content-generator.js`, `seo-generator.js`, `spec-generator.js`, `transform-engine.js`, `variant-detector.js`, `formatters.js` | Migrate to owning service during Phase 1-2 |

**Migration rule:** Move business utilities to owning service as each service is extracted. Don't move them all at once.

---

## Migration Phases

### Phase 0 — Fix live defects (1–2 days)
No architecture change. Just fix what's broken in production.

**0.1 — Rate limiter** (`apps/storefront/src/lib/rate-limit.ts`)
Replace `new Map()` with Supabase table-backed or Upstash Redis limiter. Payment endpoint (`initiateMpesaStkAction`) is unprotected under autoscaling.

**0.2 — Amount encoding** (`apps/mpesa-service/src/index.ts:188`)
Remove `/ 100`. Prices are whole KES. `total_amount: 75000` means KES 75,000.

**0.3 — Transcription null crash** (`apps/agent-service/src/index.ts`)
Find where `inputTranscription.text` is accessed on a string (not an object). Guard with optional chaining.

**0.4 — Stock decrement**
Temporary fix: add stock decrement logic to notif-service `handleOrderCreated` until catalog-service exists. Long-term: catalog-service owns this.

---

### Phase 1 — Extract order-service (1–2 weeks)

1. Create `apps/order-service/` — Express + TypeScript, same Dockerfile pattern as mpesa-service
2. Copy business logic from `checkout/actions.ts` and `fulfillment-actions.ts` into order-service REST handlers
3. Update `apps/storefront/src/app/checkout/actions.ts` to call `ORDER_SERVICE_URL/orders` via HTTP
4. Update `apps/storefront/src/app/admin/orders/fulfillment/fulfillment-actions.ts` to call order-service REST
5. `ORDER_CREATED` and `PAYMENT_INITIATE` publishers move from storefront → order-service
6. Add `payment.confirmed`/`payment.failed` Pub/Sub subscription to order-service to update payment status

**Validation checkpoint:**
- Full checkout: storefront → order-service REST → `payment.initiate` event → mpesa-service → Daraja → callback → `payment.confirmed` → notif-service
- Admin dispatch: order-service REST `POST /orders/:id/dispatch` → `order.dispatched` → notif-service
- mpesa-service and notif-service receive identical events — no changes needed in them

---

### Phase 2 — Extract catalog-service (2–3 weeks)

1. Create `apps/catalog-service/` — Express + TypeScript
2. Move `admin/products/actions.ts` logic (650 lines) into catalog-service REST handlers
3. Move `admin/inventory/`, `admin/bundles/`, `admin/marketing/` action logic
4. Admin UI pages call catalog-service REST instead of direct Supabase writes
5. Add `order.created` Pub/Sub subscription → decrement `product_variants.stock_quantity`
6. Move `daraja.js` from `packages/shared` into `apps/mpesa-service`
7. Move AI content tools (`content-generator.js`, etc.) into `apps/catalog-service`

**Validation checkpoint:**
- Admin creates product → appears in storefront SSR (storefront reads Supabase directly)
- Place order → `order.created` consumed by catalog-service → `stock_quantity` decremented

---

### Phase 3 — API Gateway (1 week)

1. Create `apps/gateway/` — nginx Docker image
2. Configure `nginx.conf` with `limit_req_zone` rate limiting (replaces `rate-limit.ts`)
3. Add Supabase JWT validation (Lua module or lightweight Node sidecar)
4. Update Cloud Run service URLs to be VPC-internal; only gateway is public

**Validation checkpoint:**
- Payment endpoint: 6 rapid requests from 2 Cloud Run instances → gateway rejects at 5/min (not 5/min per instance)

---

### Phase 4 — Activate unused topics (1 week)

1. **`agent.intent`:** Add publish in `agent-service/src/tools.ts` when search intent is detected
2. **`recommendation.ready`:** Add publish in `ml-service` after recommendation computation
3. **`product.import`:** Add publish in catalog-service after bulk import (triggers ml re-embedding)
4. **`order.updated`:** Add publish in order-service on every status transition; notif-service sends SMS

---

### Phase 5 — notif-service delivery (1 week)

Replace all `log.info("... skipped")` stubs with real provider calls:
- Resend API — transactional email (order confirmation, payment receipt)
- Africa's Talking — SMS (payment confirmed, order dispatched, status updates)

---

## What Stays the Same After Full Migration

- Supabase (single instance, all existing migrations, pgvector, RLS policies)
- GCP Pub/Sub (all 11 existing topics, all subscriptions in `infra/pubsub-topics.yaml`)
- Cloud Run deployment topology (each service = one Cloud Run service)
- Cloud Scheduler jobs (stay in notif-service, all 4 jobs unchanged)
- Gemini Live BIDI WebSocket loop (agent-service core loop is untouched)
- Next.js 15 App Router (storefront framework unchanged)
- Turborepo monorepo structure
- `packages/shared` event contracts (`TOPICS` constants, `createEvent`, `BaseEvent`)
- All Supabase migrations (no schema changes needed for this migration)
- All 4 Dockerfiles (minor path changes only)

## What Fundamentally Changes

| Before | After |
|--------|-------|
| Storefront server actions: 200–300 lines of DB operations | Storefront server actions: ~20-line HTTP dispatchers |
| `order.created` published from Next.js server action | `order.created` published from order-service (correct domain) |
| `payment.initiate` published from Next.js server action | `payment.initiate` published from order-service |
| Admin product CRUD in storefront | Admin product CRUD in catalog-service REST API |
| Stock quantity never decrements on purchase | catalog-service consumes `order.created` and decrements stock |
| Rate limiting per-instance (`new Map()`) | Rate limiting at gateway level (nginx `limit_req_zone`) |
| 5 Pub/Sub topics declared but producing nothing | All 11 topics active with real producers and consumers |
| `packages/shared` contains M-Pesa helpers and AI content tools | Business utilities live in their owning services |

---

## Key Files for Implementation

| File | What happens to it |
|------|--------------------|
| `apps/storefront/src/app/checkout/actions.ts` | Becomes 20-line HTTP dispatcher calling order-service |
| `apps/storefront/src/app/admin/orders/fulfillment/fulfillment-actions.ts` | Logic moves to order-service |
| `apps/storefront/src/app/admin/products/actions.ts` | 650 lines move to catalog-service |
| `apps/storefront/src/lib/rate-limit.ts` | Replaced by gateway-level rate limiting |
| `packages/shared/lib/events.js` | Single source of truth — do not duplicate TOPICS anywhere |
| `apps/agent-service/src/index.ts` | Phase 0 bug fix + Phase 4 `agent.intent` publish |
| `apps/mpesa-service/src/index.ts` | Fix `/100` amount bug at line 188 |
| `apps/notif-service/src/index.ts` | Add delivery providers (Resend, Africa's Talking) |
| `infra/pubsub-topics.yaml` | Reference for all topic/subscription names |
| `infra/setup-pubsub.sh` | Run once per GCP environment to provision topics |

---

## Risk Register

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Checkout breaks during Phase 1 extraction | High | Blue/green: keep storefront fallback until order-service validates end-to-end in staging |
| Stock decrement overselling in-flight orders during Phase 2 | Medium | Add idempotency key (order ID) to stock decrement — skip if already processed |
| Competition deadline before Phase 1–2 complete | Medium | Phase 0 fixes the live defects. Architecture extraction is post-competition hardening |
| mpesa-service still writes order columns directly | Low | Acceptable as interim. Fix in Phase 1 when order-service owns the state machine |

---

## Environment Variables Reference

New variables needed for the extracted services:

```bash
# order-service
ORDER_SERVICE_URL=https://order-service-xxx-uc.a.run.app
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
GOOGLE_CLOUD_PROJECT=trovestak
PUBSUB_SUBSCRIPTION_PAYMENT_CONFIRMED=notif-payment-confirmed
PUBSUB_SUBSCRIPTION_PAYMENT_FAILED=mpesa-payment-failed

# catalog-service
CATALOG_SERVICE_URL=https://catalog-service-xxx-uc.a.run.app
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
GOOGLE_CLOUD_PROJECT=trovestak
PUBSUB_SUBSCRIPTION_ORDER_CREATED=catalog-order-created  # new subscription needed

# storefront (after migration)
ORDER_SERVICE_URL=...
CATALOG_SERVICE_URL=...
# Remove: direct DB write env vars from checkout/admin actions
```

---

*Last updated: 2026-03-16. Authored via codebase audit of trovestak monorepo (all 5 existing services read). See `ideas/TROVESTAK_AI_BIBLE.md` for product spec and `CLAUDE.md` for coding standards.*
