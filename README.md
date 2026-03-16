# Trovestak — TroveVoice AI Shopping Concierge

> **Kenya's voice-first electronics store.** Talk to TroveVoice, get expert recommendations, and pay with M-Pesa — all without typing a word.

**Live demo:** https://storefront-293424180731.us-central1.run.app

Built for the [Gemini Live Agent Challenge](https://geminiliveagentchallenge.devpost.com/) — Live Agents category.

---

## What is TroveVoice?

TroveVoice is a real-time AI shopping concierge powered by **Google Gemini Live API**. It sits as a floating widget on every storefront page and lets customers shop by voice in natural Kenyan English.

- Speak naturally: "I need a laptop for university under 60,000 KES"
- TroveVoice searches the catalog using pgvector semantic search, expands vague queries via a research sub-agent with Google Search grounding, and responds with personalized recommendations — all in real time
- Interrupt mid-response, change direction, ask follow-ups
- Proceeds directly to M-Pesa STK Push checkout — no keyboard required

### Agent Tools

| Tool | What it does |
|------|-------------|
| `search_products` | Semantic vector search over 100+ products (pgvector, `gemini-embedding-001`) |
| `research_agent` | Sub-agent that expands vague queries into 5 specific searches via Google Search |
| `get_ml_recommendations` | Personalized picks based on ML taste profile (TensorFlow.js) |
| `get_concierge_context` | Loads shopper history and preferences for the session |
| `compare_products` | Side-by-side spec comparison explained in plain language |
| `initiate_checkout` | Triggers M-Pesa STK Push directly from voice |

---

## Architecture

```
User Browser
    │
    ▼
Storefront (Next.js 15, Cloud Run :3000)
    │                    │
    │ WebSocket (wss://) │ Server Actions
    ▼                    ▼
Agent Service ──────► Gateway (:8090)
(Gemini Live API         │
 ADK 1.4.2+)             ├──► Catalog Service (:8082)
 :8088                   ├──► Order Service   (:8083)
    │                    ├──► M-Pesa Service  (:8081)  ──► Safaricom Daraja (STK Push)
    │ Tool calls          ├──► Notif Service   (:8080)  ──► Resend (email/SMS)
    ▼                    └──► ML Service      (:8001)  ──► TensorFlow.js recommendations
Supabase
(PostgreSQL + pgvector 768-dim)

All services ──► Google Cloud Pub/Sub (event bus)
All services ──► Google Cloud Run (us-central1, project: trovestak)
Secrets      ──► Google Secret Manager
Images       ──► Google Artifact Registry
CI/CD        ──► Google Cloud Build (cloudbuild.yaml — 8-service pipeline)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 App Router, TypeScript, Tailwind CSS 4, shadcn/ui |
| Voice AI | Google Gemini Live API (real-time audio), ADK 1.4.2+ |
| Embeddings | `gemini-embedding-001` via v1beta REST, 768-dim pgvector |
| Backend | Node.js microservices (TypeScript), 8 Cloud Run services |
| Database | Supabase (PostgreSQL + pgvector + Realtime) |
| Payments | M-Pesa Daraja API — STK Push, Manual Till, Cash on Delivery |
| ML | TensorFlow.js taste profile engine |
| Events | Google Cloud Pub/Sub |
| Infra | Cloud Run, Cloud Build, Artifact Registry, Secret Manager |
| Monorepo | Turborepo + pnpm workspaces |

---

## Deployed Services

| Service | Cloud Run URL |
|---------|--------------|
| Storefront | https://storefront-293424180731.us-central1.run.app |
| Agent Service | https://agent-service-293424180731.us-central1.run.app |
| ML Service | https://ml-service-293424180731.us-central1.run.app |
| M-Pesa Service | https://mpesa-service-293424180731.us-central1.run.app |

All deployed to GCP project `trovestak`, region `us-central1`.

---

## Quick Start (Local Dev)

### Prerequisites

- Node.js 20+
- pnpm 9+
- Google Cloud project with Gemini API enabled
- Supabase project

### Install

```bash
git clone <repo>
cd trovestak
pnpm install
```

### Environment Variables

Copy and fill in the required variables:

```bash
# apps/agent-service/.env
GEMINI_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
ML_SERVICE_URL=http://localhost:8001
MPESA_SERVICE_URL=http://localhost:8081

# apps/storefront/.env.local
NEXT_PUBLIC_AGENT_WS_URL=ws://localhost:8088
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Run

```bash
# All services
pnpm dev

# Storefront only (port 3000)
pnpm --filter @trovestak/storefront dev

# Agent service only (port 8088)
pnpm --filter @trovestak/agent-service dev
```

### Service Ports

| Service | Port |
|---------|------|
| Storefront | 3000 |
| Agent Service | 8088 |
| M-Pesa Service | 8081 |
| Notif Service | 8080 |
| ML Service | 8001 |

---

## Deploy to Google Cloud

The full 8-service pipeline is defined in [`cloudbuild.yaml`](./cloudbuild.yaml).

```bash
gcloud builds submit --config cloudbuild.yaml
```

Each service has its own `Dockerfile` under `apps/<service>/Dockerfile`.

---

## Repository Structure

```
trovestak/
├── apps/
│   ├── storefront/          # Next.js 15 frontend
│   ├── agent-service/       # Gemini Live WebSocket bridge (TroveVoice)
│   ├── mpesa-service/       # M-Pesa Daraja STK Push
│   ├── notif-service/       # Pub/Sub event notifications
│   ├── ml-service/          # TensorFlow.js recommendations
│   ├── catalog-service/     # Product catalog API
│   ├── order-service/       # Order management
│   └── gateway/             # API gateway
├── packages/
│   └── shared/              # Shared types, events, Supabase clients
├── ideas/
│   └── TROVESTAK_AI_BIBLE.md  # Full technical specification (1171 lines)
├── cloudbuild.yaml          # GCP Cloud Build pipeline
└── turbo.json
```

## Key Files

| File | Purpose |
|------|---------|
| `apps/agent-service/src/tools.ts` | All 6 concierge tool implementations |
| `apps/agent-service/src/agent.ts` | TroveVoice system prompt + tool declarations |
| `apps/storefront/src/components/concierge/ConciergeVoice.tsx` | Voice UI widget |
| `apps/storefront/src/app/checkout/actions.ts` | M-Pesa STK Push + order creation |
| `ideas/TROVESTAK_AI_BIBLE.md` | Canonical product spec |
