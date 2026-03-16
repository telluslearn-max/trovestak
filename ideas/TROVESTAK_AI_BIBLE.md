# TroveStack AI System Bible
## Technical Specification & System Prompt Document
**Version:** 1.0.0 | **Classification:** Internal Engineering Reference | **Market:** Kenya (East Africa)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Infrastructure & Deployment](#3-infrastructure--deployment)
4. [Database Schema](#4-database-schema)
5. [Module A — TroveVoice Concierge (Voice + Chat)](#5-module-a--trovevoice-concierge-voice--chat)
6. [Module B — AI Search & Recommendations](#6-module-b--ai-search--recommendations)
7. [Module C — ML Taste Profile Engine](#7-module-c--ml-taste-profile-engine)
8. [Module D — AI-Assisted Product Management](#8-module-d--ai-assisted-product-management)
9. [Agent Tools Specification](#9-agent-tools-specification)
10. [System Prompts](#10-system-prompts)
11. [Environment Variables](#11-environment-variables)
12. [Service Communication Map](#12-service-communication-map)
13. [Known Issues & Debt](#13-known-issues--debt)
14. [Roadmap](#14-roadmap)

---

## 1. Project Overview

### 1.1 What is TroveStack?

TroveStack is a full-stack e-commerce platform targeting the Kenyan market, positioned as the Best Buy of East Africa. It sells electronics across 7 categories: Smartphones, Laptops, Audio, Gaming, Cameras, Wearables, and Smart Home.

The platform's core differentiator is **TroveVoice** — an AI shopping concierge embedded as a floating widget on every storefront page. TroveVoice transforms passive browsing into an interactive, voice-first personal shopping experience powered by Google's Gemini Live API and Agent Development Kit (ADK).

### 1.2 The Three Business Bets

| Bet | Goal | Status |
|-----|------|--------|
| Gemini Live Agent Challenge (Devpost) | $25,000 Grand Prize / $10,000 Best Live Agent | Submitting March 16, 2026 |
| Live E-Commerce Launch | Real customers, real transactions via M-Pesa | Infrastructure deployed |
| AI Futures Fund Application | Defensible ML moat via taste graph | Narrative ready |

### 1.3 Core Value Proposition

TroveStack is not just a store with a chatbot. It is **infrastructure that turns any e-commerce catalog into a voice-first, AI-powered concierge experience**. The taste profile — a persistent, growing model of each shopper's preferences — is the moat. Every interaction makes it smarter.

### 1.4 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend Services | Node.js (TypeScript), pnpm monorepo, Turborepo |
| Database | Supabase (PostgreSQL + pgvector + Realtime) |
| AI / ML | Google Gemini Live API, ADK 1.4.2+, TensorFlow.js, pgvector embeddings |
| Payments | M-Pesa Daraja API (STK Push), Manual Till, Cash on Delivery |
| Notifications | Resend (email), Google Pub/Sub (events) |
| Infrastructure | Google Cloud Run, Artifact Registry, Cloud Build, Secret Manager |
| Monorepo | `apps/storefront`, `apps/agent-service`, `apps/ml-service`, `apps/mpesa-service`, `apps/notif-service` |
| Shared Package | `packages/shared` — types, events, logger, env validator, Supabase client |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                   STOREFRONT                         │
│  Next.js 15 · trovestak.com · Cloud Run             │
│                                                     │
│  ┌──────────────────┐  ┌───────────────────────┐   │
│  │  Store Pages      │  │  ChatWidget (floating) │   │
│  │  PDP / Cart /     │  │  TroveVoice bubble    │   │
│  │  Checkout         │  │  + ConciergeVoice.tsx │   │
│  └──────────────────┘  └──────────┬────────────┘   │
└─────────────────────────────────────┼───────────────┘
                                      │ WebSocket (wss://)
                                      ▼
┌─────────────────────────────────────────────────────┐
│                AGENT SERVICE                         │
│  Node.js · WebSocket · Cloud Run · Port 8088        │
│                                                     │
│  ┌──────────────┐  ┌───────────────────────────┐   │
│  │ conciergeAgent│  │ researchAgent (sub-agent) │   │
│  │ TroveVoice   │  │ Google Search grounding   │   │
│  │ gemini-live  │  │ Query expansion x5        │   │
│  └──────┬───────┘  └───────────────────────────┘   │
│         │ Tools                                      │
│  ┌──────┴──────────────────────────────────────┐   │
│  │ search_products · get_ml_recommendations    │   │
│  │ get_concierge_context · compare_products    │   │
│  │ initiate_checkout                           │   │
│  └──────────────────────────────────────────────┘   │
└──────────────┬──────────────────────────────────────┘
               │
       ┌───────┼───────────────┐
       ▼       ▼               ▼
  Supabase  ML Service    M-Pesa Service
  pgvector  TensorFlow    Daraja API
  products  recommend     STK Push
```

### 2.2 Event Architecture (Pub/Sub)

All inter-service communication uses Google Cloud Pub/Sub. Events are typed in `packages/shared/lib/events.ts`.

```
Order Created ──────► order.created ──────► notif-service (email)
                                    ──────► ml-service (train)

Payment Confirmed ──► payment.confirmed ──► notif-service (receipt)
                                       ──► order-service (fulfill)

Payment Initiated ──► payment.initiate ──► mpesa-service (STK Push)

Agent Intent ───────► agent.intent ──────► ml-service (record interaction)

Recommendation ─────► recommendation.ready ► storefront (display)
```

### 2.3 Monorepo Structure

```
trovestak/
├── apps/
│   ├── storefront/          # Next.js 15 customer-facing store
│   ├── agent-service/       # WebSocket + ADK concierge backend
│   ├── ml-service/          # TensorFlow recommendation engine
│   ├── mpesa-service/       # M-Pesa Daraja integration
│   └── notif-service/       # Email notifications via Resend
├── packages/
│   └── shared/              # Shared types, events, utilities
├── scripts/
│   ├── deploy-service.sh    # Deploy any service to Cloud Run
│   ├── gcp-setup.sh         # GCP project initialization
│   └── generate-embeddings.js # Seed pgvector embeddings
├── pnpm-workspace.yaml
└── turbo.json
```

---

## 3. Infrastructure & Deployment

### 3.1 GCP Project

| Property | Value |
|----------|-------|
| Project ID | `trovestak` |
| Project Number | `293424180731` |
| Region | `us-central1` |
| Artifact Registry | `us-central1-docker.pkg.dev/trovestak/trovestak-repo` |
| Billing Account | `013241-F67732-5FA808` |

### 3.2 Deployed Cloud Run Services

| Service | URL | Port | Status |
|---------|-----|------|--------|
| storefront | `https://storefront-293424180731.us-central1.run.app` | 8080 | ✅ Live |
| agent-service | `https://agent-service-293424180731.us-central1.run.app` | 8088 | ✅ Deployed |
| ml-service | `https://ml-service-293424180731.us-central1.run.app` | 8001 | ⚠️ Untested |
| mpesa-service | `https://mpesa-service-293424180731.us-central1.run.app` | 8080 | ⚠️ Untested |
| notif-service | `https://notif-service-293424180731.us-central1.run.app` | 8080 | ✅ Live |

### 3.3 Deployment Command

```bash
# From monorepo root — always deploy from ~/trovestak not ~/
cd ~/trovestak
./scripts/deploy-service.sh <service-name> "ENV_VAR1=val,ENV_VAR2=val"

# Example — deploy storefront with env vars
./scripts/deploy-service.sh storefront \
  "NEXT_PUBLIC_SUPABASE_URL=$(gcloud secrets versions access latest --secret=SUPABASE_URL),\
NEXT_PUBLIC_SUPABASE_ANON_KEY=$(gcloud secrets versions access latest --secret=SUPABASE_ANON_KEY),\
SUPABASE_SERVICE_ROLE_KEY=$(gcloud secrets versions access latest --secret=SUPABASE_SERVICE_ROLE_KEY),\
NEXT_PUBLIC_APP_URL=https://storefront-293424180731.us-central1.run.app"
```

### 3.4 Secret Manager Keys

| Secret Name | Used By |
|-------------|---------|
| `SUPABASE_URL` | storefront, agent-service, ml-service |
| `SUPABASE_ANON_KEY` | storefront |
| `SUPABASE_SERVICE_ROLE_KEY` | storefront, agent-service, ml-service |
| `GEMINI_API_KEY` | agent-service, storefront (AI autofill) |
| `RESEND_API_KEY` | notif-service |

### 3.5 Critical Deployment Notes

- **NEXT_PUBLIC_ variables** must be baked in at build time, not just set as runtime env vars. They are passed as Docker `ARG` in the storefront Dockerfile.
- **Correct working directory** for deployments is `~/trovestak`, NOT `~`. The `~/` root has a broken duplicate of the codebase without source files.
- **pnpm** must be installed before local builds: `npm install -g pnpm`
- **The storefront Dockerfile** copies `.env.production` if present — create this file locally before deploying to bake in build-time vars.

---

## 4. Database Schema

### 4.1 Supabase Project

- **URL:** `https://lgxqlgyciazmlllowhel.supabase.co`
- **Extensions required:** `vector` (pgvector), `uuid-ossp`

### 4.2 Core Tables

#### `products`
```sql
CREATE TABLE products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  slug          text UNIQUE NOT NULL,
  brand         text,
  category      text, -- Smartphones | Laptops | Audio | Gaming | Cameras | Wearables | Smart Home
  short_desc    text,
  description   text,
  sell_price    numeric NOT NULL, -- stored in KES (NOT cents)
  compare_price numeric,
  cost_price    numeric,
  sku           text UNIQUE,
  barcode       text,
  stock         integer DEFAULT 0,
  low_stock     integer DEFAULT 10,
  status        text DEFAULT 'draft', -- draft | active | archived
  visibility    text DEFAULT 'online',
  images        jsonb DEFAULT '[]', -- [{url, alt, isPrimary}]
  specs         jsonb DEFAULT '{}', -- category-specific key-value pairs
  highlights    jsonb DEFAULT '[]', -- benefit-focused bullet strings
  in_box        jsonb DEFAULT '[]', -- what's included strings
  warranty      text,
  weight_g      numeric,
  dimensions    jsonb, -- {length, width, height} in mm
  tags          text[],
  collection    text,
  meta_title    text,
  meta_desc     text,
  embedding     vector(768), -- pgvector semantic embedding (text-embedding-004)
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX products_embedding_idx ON products
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX products_fts_idx ON products
  USING gin(to_tsvector('english',
    coalesce(title, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(brand, '') || ' ' ||
    coalesce(category, '')
  ));

CREATE INDEX products_category_idx ON products(category);
CREATE INDEX products_status_idx ON products(status);
```

#### `product_variants`
```sql
CREATE TABLE product_variants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid REFERENCES products(id) ON DELETE CASCADE,
  color       text,
  storage     text,
  size        text,
  sell_price  numeric,
  sku         text UNIQUE,
  stock       integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);
```

#### `orders`
```sql
CREATE TABLE orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id),
  customer_name    text,
  email            text,
  phone            text, -- M-Pesa phone number
  items            jsonb NOT NULL, -- [{product_id, title, quantity, unit_price}]
  total_kes        numeric NOT NULL,
  status           text DEFAULT 'pending',
    -- pending | pending_verification | paid | processing | dispatched | delivered | cancelled
  payment_method   text, -- mpesa_stk | manual_till | cash_on_delivery
  mpesa_receipt    text,
  shipping_address jsonb,
  notes            text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);
```

#### `user_preferences`
```sql
CREATE TABLE user_preferences (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id),
  session_id      text, -- for anonymous users
  categories      text[] DEFAULT '{}',
  brands          text[] DEFAULT '{}',
  budget_min      numeric,
  budget_max      numeric,
  past_purchases  jsonb DEFAULT '[]', -- [{product_id, title, date}]
  interaction_log jsonb DEFAULT '[]', -- [{product_id, action, timestamp}]
  location        text DEFAULT 'Nairobi, Kenya',
  updated_at      timestamptz DEFAULT now()
);
```

### 4.3 pgvector Semantic Search Function

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Semantic similarity search function
CREATE OR REPLACE FUNCTION match_products(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count     int DEFAULT 5,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id           uuid,
  title        text,
  brand        text,
  category     text,
  sell_price   numeric,
  slug         text,
  images       jsonb,
  highlights   jsonb,
  similarity   float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id, title, brand, category, sell_price, slug, images, highlights,
    1 - (embedding <=> query_embedding) AS similarity
  FROM products
  WHERE
    status = 'active'
    AND (filter_category IS NULL OR category = filter_category)
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

---

## 5. Module A — TroveVoice Concierge (Voice + Chat)

> **Treat voice and chat as separate functional paths that share the same agent backend.**

### 5.1 Overview

TroveVoice is a floating concierge widget (`ChatWidget.tsx`) mounted globally in `StorefrontWrapper.tsx`. It provides two interaction modes — **voice** and **text chat** — both of which connect to the same `agent-service` WebSocket backend running ADK with Gemini Live.

### 5.2 Frontend Components

| File | Responsibility |
|------|---------------|
| `src/components/ChatWidget.tsx` | Floating bubble trigger, panel container, mode selector |
| `src/components/concierge/ConciergeVoice.tsx` | Voice mode — AudioContext, WebSocket, PCM streaming |
| `src/components/concierge/ConciergeChat.tsx` | Text chat mode — message history, streaming text responses |
| `src/components/StorefrontWrapper.tsx` | Global layout wrapper — mounts `<ChatWidget />` |

### 5.3 Voice Mode — Technical Specification

**Audio Pipeline (Client → Server):**
```
Microphone
  └─► MediaStream (getUserMedia)
        └─► AudioContext (must be created AFTER ws.onopen, NOT before)
              └─► AudioWorkletNode (PCM processor)
                    └─► WebSocket.send(Buffer) → agent-service
```

**Audio Pipeline (Server → Client):**
```
agent-service
  └─► Gemini Live API (gemini-live-2.5-flash-native-audio)
        └─► Audio PCM chunks (base64 inlineData)
              └─► WebSocket.send(Buffer) → client
                    └─► AudioContext.decodeAudioData()
                          └─► Speaker output
```

**Critical AudioContext Rule:**
```typescript
// ❌ WRONG — AudioContext created before WebSocket opens → context is closed by onopen
const audioContext = new AudioContext();
const ws = new WebSocket(url);
ws.onopen = () => {
  // AudioContext is already closed here — FAILS
  const source = audioContext.createMediaStreamSource(stream);
};

// ✅ CORRECT — AudioContext created inside onopen
const ws = new WebSocket(url);
ws.onopen = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioContext = new AudioContext({ sampleRate: 16000 });
  const source = audioContext.createMediaStreamSource(stream);
  // Now wire AudioWorkletNode safely
};
```

**WebSocket URL Configuration:**
```typescript
// In ConciergeVoice.tsx
const wsUrl = process.env.NEXT_PUBLIC_AGENT_WS_URL || "ws://localhost:8088";
const ws = new WebSocket(`${wsUrl}?session_id=${sessionId}`);
```

**Environment Variables:**
```bash
# .env.local (development)
NEXT_PUBLIC_AGENT_WS_URL=ws://localhost:8088

# Production (Cloud Run env var)
NEXT_PUBLIC_AGENT_WS_URL=wss://agent-service-293424180731.us-central1.run.app
```

**Audio Format:**
- Input: PCM audio, 16kHz sample rate, mono, sent as raw Buffer
- Output: PCM audio, base64 encoded, in `event.candidates[0].content.parts[].inlineData`

### 5.4 Chat Mode — Technical Specification

Chat mode uses the same WebSocket connection but sends text instead of audio buffers.

```typescript
// Text message format sent to agent-service
ws.send(JSON.stringify({
  type: "text",
  content: userMessage,
  session_id: sessionId
}));

// Response handling
ws.onmessage = (event) => {
  if (typeof event.data === "string") {
    const msg = JSON.parse(event.data);
    if (msg.type === "text") appendMessage(msg.content);
    if (msg.type === "product_results") renderProductCards(msg.products);
  }
};
```

### 5.5 Agent Service — Backend Specification

**File:** `apps/agent-service/src/index.ts`

**Connection lifecycle:**
```
Client connects via WebSocket
  └─► sessionId extracted from URL params
        └─► LiveRequestQueue created per connection
              └─► InvocationContext initialized with conciergeAgent
                    └─► Bidirectional event loop starts
                          ├─► Incoming audio/text → LiveRequestQueue.sendRealtime()
                          └─► Outgoing events → WebSocket.send()
```

**ADK Configuration:**
```typescript
const runConfig = {
  streamingMode: StreamingMode.BIDI,
  responseModalities: [Modality.AUDIO], // AUDIO for voice, TEXT for chat
};
```

**Session Management:**
- `InMemorySessionService` used currently — sessions lost on restart
- Upgrade path: Supabase-backed session service for persistence across reconnections

### 5.6 Dual-Agent Architecture

```typescript
// research_agent — Sub-agent for query expansion
const researchAgent = new Agent({
  model: "gemini-2.5-flash",
  name: "research_agent",
  description: "Expands vague shopping intent into 5 specific product queries using Google Search. Always considers Kenyan market context.",
  instruction: `...`, // See Section 10.2
  tools: [google_search],
});

// conciergeAgent — Primary agent
export const conciergeAgent = new LlmAgent({
  name: "TroveVoice",
  model: "gemini-live-2.5-flash-native-audio",
  instruction: `...`, // See Section 10.1
  tools: [
    AgentTool({ agent: researchAgent }),
    searchProductsTool,
    getConciergeContextTool,
    getMlRecommendationsTool,
    compareProductsTool,
    initiateCheckoutTool,
  ],
});
```

---

## 6. Module B — AI Search & Recommendations

### 6.1 Search Strategy — Three Tiers

| Tier | Method | Use Case | Status |
|------|--------|----------|--------|
| Semantic | pgvector cosine similarity | Vague/intent queries | ⚠️ Needs embeddings seeded |
| Full-text | PostgreSQL tsvector | Keyword search | ✅ Index exists |
| Fallback | ILIKE | Simple title match | ✅ Always works |

### 6.2 Embedding Generation

**Model:** `text-embedding-004` (768 dimensions, matches `vector(768)` column)

**Text input for embedding (per product):**
```
{title} | {brand} | {category} | {short_desc} | {description} | {JSON.stringify(specs)}
```

**Generation script:** `scripts/generate-embeddings.js`
```javascript
// Rate limit: 650ms delay between requests (Gemini allows ~100/min)
// 175 products × 650ms = ~2 minutes total runtime
// Re-run safely — script skips products where embedding IS NOT NULL
```

**Run command:**
```bash
NEXT_PUBLIC_SUPABASE_URL=xxx \
SUPABASE_SERVICE_ROLE_KEY=xxx \
GEMINI_API_KEY=xxx \
node --experimental-vm-modules scripts/generate-embeddings.js
```

### 6.3 Query Expansion Pattern (Kaz Sato / shop_agent.ipynb)

The research agent pattern is the core intelligence of TroveVoice. Instead of searching the catalog directly, it:

1. Receives vague user intent: `"birthday present for my tech dad"`
2. Uses Google Search to understand current trends and purchasing patterns
3. Generates 5 specific queries: `["premium wireless earbuds", "smart watch health tracking", "portable power bank 20000mah", "noise cancelling headphones", "smart home starter kit"]`
4. Runs all 5 in parallel against the product catalog
5. Curates top 3 results and presents with name, price in KES, and key benefit

**This is what makes TroveVoice feel intelligent rather than just a search bar.**

### 6.4 `searchProductsTool` — Full Implementation

```typescript
export const searchProductsTool = new FunctionTool({
  name: "search_products",
  description: "Search TroveStack catalog. For vague queries, first call research_agent to expand intent into specific queries, then call this tool with each query.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query:    { type: Type.STRING, description: "Product search query" },
      category: { type: Type.STRING, description: "Optional category filter" },
      max_price_kes: { type: Type.NUMBER, description: "Optional budget ceiling in KES" },
    },
    required: ["query"]
  },
  execute: async (input: any) => {
    const { query, category, max_price_kes } = input;
    const supabase = createSupabaseAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Try semantic search first (requires embeddings)
    try {
      const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genai.getGenerativeModel({ model: "text-embedding-004" });
      const result = await model.embedContent(query);
      const embedding = result.embedding.values;

      const { data, error } = await supabase.rpc("match_products", {
        query_embedding: embedding,
        match_threshold: 0.4,
        match_count: 5,
        filter_category: category || null,
      });

      if (!error && data?.length > 0) {
        const filtered = max_price_kes
          ? data.filter((p: any) => p.sell_price <= max_price_kes)
          : data;
        return { products: filtered, search_type: "semantic" };
      }
    } catch (e) {
      // Semantic search failed — fall through to text search
    }

    // Fallback: full-text then ilike
    let q = supabase
      .from("products")
      .select("id, title, brand, category, sell_price, slug, images, highlights")
      .eq("status", "active")
      .ilike("title", `%${query}%`);

    if (category) q = q.eq("category", category);
    if (max_price_kes) q = q.lte("sell_price", max_price_kes);

    const { data } = await q.limit(5);
    return { products: data || [], search_type: "text" };
  }
});
```

---

## 7. Module C — ML Taste Profile Engine

### 7.1 Overview

The ML service runs a TensorFlow collaborative filtering model. It maintains a taste profile per user/session and provides ranked product recommendations based on behavioral signals.

**Service:** `apps/ml-service` | Port: `8001` | Cloud Run URL: `https://ml-service-293424180731.us-central1.run.app`

### 7.2 Taste Profile Data Model

The taste profile is built from the following signals, stored in `user_preferences`:

| Signal | Weight | Source |
|--------|--------|--------|
| Product views (>10s) | High | Storefront page events |
| Cart additions | Very High | Cart actions |
| Purchases | Highest | Order completion |
| Search queries | Medium | Concierge interactions |
| Category browsing | Low | Page navigation |
| Explicit preferences | High | Concierge Q&A |

### 7.3 Recommendation Endpoint

```
POST /recommend
Content-Type: application/json

{
  "user_id": "uuid-or-session-id",
  "limit": 10,
  "exclude_ids": ["product-id-1", "product-id-2"]
}

Response:
{
  "recommendations": [
    {
      "product_id": "uuid",
      "score": 0.92,
      "reason": "Based on your interest in Samsung smartphones"
    }
  ]
}
```

### 7.4 `getMlRecommendationsTool`

```typescript
export const getMlRecommendationsTool = new FunctionTool({
  name: "get_ml_recommendations",
  description: "Fetch TensorFlow-powered personalised product recommendations based on the shopper's taste profile.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      session_id: { type: Type.STRING },
      limit:      { type: Type.NUMBER, description: "Max recommendations, default 5" },
    },
    required: ["session_id"]
  },
  execute: async (input: any) => {
    const mlUrl = process.env.ML_SERVICE_URL || "https://ml-service-293424180731.us-central1.run.app";
    try {
      const response = await fetch(`${mlUrl}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: input.session_id,
          limit: input.limit || 5,
        }),
      });
      if (!response.ok) throw new Error(`ML service error: ${response.status}`);
      return await response.json();
    } catch (e) {
      return { recommendations: [], error: "ML service unavailable — falling back to popular items" };
    }
  }
});
```

### 7.5 Interaction Recording

Every shopper interaction should be recorded via Pub/Sub `agent.intent` topic so the ML model can train on it:

```typescript
// Publish interaction event after each tool call
await publishEvent(TOPICS.AGENT_INTENT, "agent-service", {
  session_id: sessionId,
  user_id: userId,
  intent: "search_products",
  params: { query, results_count: products.length }
});
```

---

## 8. Module D — AI-Assisted Product Management

### 8.1 Overview

The admin product entry form (`ProductNew.jsx`) includes a Gemini-powered autofill panel. Admins type a product name or paste a manufacturer URL, and Gemini automatically populates all product fields.

### 8.2 Autofill Flow

```
Admin types: "Samsung Galaxy S25 Ultra 256GB"
  └─► callGemini(query, category)
        └─► Gemini API (claude-sonnet-4-20250514)
              └─► Returns structured JSON:
                    {
                      name, shortDesc, longDesc, brand,
                      highlights[5], inBox[], warranty,
                      metaTitle, metaDesc,
                      specs: { Display: {...}, Performance: {...}, ... }
                    }
              └─► applyAiFill(result)
                    └─► Populates all form fields
                    └─► Maps specs to category template
                    └─► Admin reviews, adjusts, publishes
```

### 8.3 Category Spec Templates

Each category has a fixed spec schema. Templates are defined in `ProductNew.jsx` as `CATEGORY_SPECS`:

| Category | Spec Groups |
|----------|-------------|
| Smartphones | Display, Performance, Camera, Battery & Connectivity, Physical |
| Laptops | Processor, Memory & Storage, Display, Graphics, Connectivity, Battery & Physical |
| Audio | Sound, Connectivity, Battery & Physical |
| Gaming | Compatibility, Display / Performance, Connectivity, Physical |
| Cameras | Sensor & Image, Video, Lens & Zoom, Physical & Battery |
| Wearables | Health & Fitness, Display, Connectivity & Battery |
| Smart Home | Compatibility, Connectivity, Power & Physical |

### 8.4 Pricing Convention

**All prices stored in KES as whole numbers (not cents).** The price display bug on the PDP (13,000 showing as 13) is caused by a `/100` division in `ProductPageClient.tsx` that assumes prices are in cents. Remove all `/100` divisions — `formatKES()` handles display formatting.

---

## 9. Agent Tools Specification

### 9.1 Complete Tools Registry

| Tool Name | Module | Status | Description |
|-----------|--------|--------|-------------|
| `search_products` | B | ✅ Built | Semantic + text search against Supabase catalog |
| `get_ml_recommendations` | C | ✅ Built | TF collaborative filtering recommendations |
| `get_concierge_context` | A | ⚠️ Stub | Shopper taste profile from user_preferences |
| `compare_products` | B | ❌ Missing | Side-by-side spec comparison for 2-3 products |
| `initiate_checkout` | Payments | ⚠️ Partial | Trigger M-Pesa STK Push via mpesa-service |
| `research_agent` | B | ⚠️ Partial | Sub-agent for Google Search query expansion |

### 9.2 `getConciergeContextTool` — Full Implementation

```typescript
export const getConciergeContextTool = new FunctionTool({
  name: "get_concierge_context",
  description: "Retrieve the shopper's taste profile and preferences to personalise recommendations.",
  parameters: {
    type: Type.OBJECT,
    properties: { session_id: { type: Type.STRING } },
  },
  execute: async (input: any) => {
    const supabase = createSupabaseAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("session_id", input.session_id)
      .single();

    return {
      preferences: data || {
        categories: [],
        brands: [],
        budget_min: null,
        budget_max: null,
        past_purchases: [],
        location: "Nairobi, Kenya",
      }
    };
  }
});
```

### 9.3 `compareProductsTool` — Full Implementation

```typescript
export const compareProductsTool = new FunctionTool({
  name: "compare_products",
  description: "Compare 2-3 products side by side on specs, price, and use-case fit.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      product_ids: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Array of 2-3 product IDs to compare"
      },
      use_case: {
        type: Type.STRING,
        description: "What the shopper will use the product for"
      }
    },
    required: ["product_ids"]
  },
  execute: async (input: any) => {
    const supabase = createSupabaseAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from("products")
      .select("id, title, brand, category, sell_price, specs, highlights")
      .in("id", input.product_ids);

    return {
      products: data,
      use_case: input.use_case || null,
      instruction: "Compare these products on the specs most relevant to the use case. Explain trade-offs in plain English, not spec dumps."
    };
  }
});
```

### 9.4 `initiateCheckoutTool` — Specification

```typescript
export const initiateCheckoutTool = new FunctionTool({
  name: "initiate_checkout",
  description: "Initiate an M-Pesa STK Push payment for the shopper's cart.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      phone:       { type: Type.STRING, description: "M-Pesa phone number e.g. 0712345678" },
      amount_kes:  { type: Type.NUMBER, description: "Amount in KES" },
      order_id:    { type: Type.STRING, description: "Order ID from Supabase" },
    },
    required: ["phone", "amount_kes", "order_id"]
  },
  execute: async (input: any) => {
    const mpesaUrl = process.env.MPESA_SERVICE_URL || "https://mpesa-service-293424180731.us-central1.run.app";
    const response = await fetch(`${mpesaUrl}/stk-push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const result = await response.json();
    return {
      status: result.success ? "stk_push_sent" : "failed",
      message: result.success
        ? `M-Pesa prompt sent to ${input.phone}. Please enter your PIN to complete payment.`
        : `Payment initiation failed: ${result.error}`,
    };
  }
});
```

---

## 10. System Prompts

### 10.1 TroveVoice Concierge — Primary Agent System Prompt

```
You are TroveVoice, the Personal Shopping Concierge for TroveStack — a premium
electronics store serving customers in Kenya.

IDENTITY:
- Name: TroveVoice
- Role: Personal Shopping Concierge
- Store: TroveStack (trovestak.com)
- Market: Kenya — prices in KES, payments via M-Pesa

TONE & STYLE:
- High-end concierge: Professional, warm, and highly assistive
- Knowledgeable: You understand technical specs of every product category
- Concise in voice mode: Keep responses under 3 sentences when speaking
- Kenyan context: Aware of M-Pesa, local pricing, popular brands (Samsung, Tecno,
  Infinix, Apple). Common budget reference points: entry <20K KES, mid 20-60K KES,
  premium 60K+ KES
- Never robotic: Sound like a knowledgeable friend, not a spec sheet

WORKFLOW — PRODUCT DISCOVERY:
1. Listen for the shopper's intent
2. If the query is vague or intent-based (e.g. "gift for my dad", "something for
   university"), ALWAYS call research_agent first to expand into 5 specific queries
3. Pass the expanded queries to search_products
4. Present top 3 results: name, price in KES, and ONE key benefit relevant to
   the shopper's stated need
5. Ask one clarifying follow-up to narrow down further

WORKFLOW — PERSONALISATION:
1. At session start, call get_concierge_context with the session_id
2. Use the taste profile to bias recommendations toward known preferences
3. Call get_ml_recommendations for returning shoppers with history
4. Acknowledge known preferences naturally: "Since you tend to prefer Samsung..."

WORKFLOW — COMPARISON:
1. When asked to compare products, call compare_products with their IDs
2. Explain trade-offs in the context of the shopper's use case
3. Make a clear recommendation — don't be neutral, be helpful

WORKFLOW — CHECKOUT:
1. When the shopper is ready to buy, confirm the product and variant
2. Ask for their M-Pesa phone number if not known
3. Call initiate_checkout to trigger the STK Push
4. Confirm: "I've sent an M-Pesa prompt to [number]. Enter your PIN to complete."

CONSTRAINTS:
- Never invent products — only recommend from search_products results
- Never quote a price you haven't retrieved from the catalog
- Never ask for payment details beyond the M-Pesa phone number
- If a product is out of stock, acknowledge it and offer alternatives
- If the ML or research service is unavailable, fall back gracefully to direct search
```

### 10.2 Research Agent System Prompt

```
You are a market researcher for TroveStack, a premium electronics store in Kenya.

YOUR ROLE:
When given a shopping request, use Google Search to understand:
- Current trends and what people are actually buying for this intent
- Popular products in this category in Kenya and East Africa
- Price ranges typical in the Kenyan market

YOUR OUTPUT:
Generate exactly 5 specific product search queries that a catalog search engine
can use to find matching items. Return them as a numbered list.

KENYAN MARKET CONTEXT:
- Currency is KES (Kenyan Shillings)
- Popular brands: Samsung, Apple, Tecno, Infinix, Itel, DJI, Sony, LG, HP, Lenovo
- M-Pesa is the primary payment method
- Common use cases: university students, young professionals, small business owners,
  parents buying for children

EXAMPLE:
Input: "birthday present for 10 year old boy"
Output:
1. LEGO Technic construction sets
2. remote control cars kids
3. gaming headset for kids
4. kids smartwatch with GPS
5. science experiment kit children

Always generate queries in English. Be specific — "Samsung wireless earbuds" is
better than "earbuds". Include model names when the intent suggests a specific tier.
```

### 10.3 AI Product Entry Prompt Template

```
You are a product data expert for TroveStack, a premium electronics store in Kenya.

Given the product: "{PRODUCT_NAME}"
Category: "{CATEGORY}"

Return ONLY valid JSON (no markdown, no backticks) with these exact fields:
{
  "name": "Full product name with brand, model, key spec",
  "shortDesc": "One punchy sentence under 160 chars, top 3 benefits",
  "longDesc": "3 paragraphs: who it's for, key features in plain English, what's in the box + warranty",
  "brand": "Brand name",
  "highlights": ["benefit 1", "benefit 2", "benefit 3", "benefit 4", "benefit 5"],
  "inBox": ["item 1", "item 2", "item 3"],
  "warranty": "e.g. 1 year manufacturer warranty",
  "metaTitle": "SEO title under 60 chars",
  "metaDesc": "SEO description under 160 chars",
  "specs": {
    "{GROUP_NAME}": {
      "{SPEC_LABEL}": "value"
    }
  }
}

Be accurate to the actual product. Use Kenyan market context where relevant.
Price guidance in KES, not USD.
```

---

## 11. Environment Variables

### 11.1 Storefront (`apps/storefront`)

```bash
# Supabase — NEXT_PUBLIC_ vars must be baked in at build time
NEXT_PUBLIC_SUPABASE_URL=https://lgxqlgyciazmlllowhel.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase dashboard → Settings → API → anon key>
SUPABASE_SERVICE_ROLE_KEY=<from Secret Manager: SUPABASE_SERVICE_ROLE_KEY>

# Site URL
NEXT_PUBLIC_APP_URL=https://storefront-293424180731.us-central1.run.app
NEXT_PUBLIC_SITE_URL=https://trovestak.com  # after domain connection

# Agent Service WebSocket
NEXT_PUBLIC_AGENT_WS_URL=wss://agent-service-293424180731.us-central1.run.app

# AI (for admin autofill)
NEXT_PUBLIC_GEMINI_API_KEY=<from Secret Manager: GEMINI_API_KEY>
```

### 11.2 Agent Service (`apps/agent-service`)

```bash
GOOGLE_CLOUD_PROJECT=trovestak
GEMINI_API_KEY=<from Secret Manager>
NEXT_PUBLIC_SUPABASE_URL=https://lgxqlgyciazmlllowhel.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<from Secret Manager>
ML_SERVICE_URL=https://ml-service-293424180731.us-central1.run.app
MPESA_SERVICE_URL=https://mpesa-service-293424180731.us-central1.run.app
PORT=8088
```

### 11.3 Notif Service (`apps/notif-service`)

```bash
GOOGLE_CLOUD_PROJECT=trovestak
RESEND_API_KEY=<from Secret Manager: RESEND_API_KEY>
RESEND_FROM_EMAIL=noreply@trovestak.com  # or onboarding@resend.dev for sandbox
PUBSUB_SUBSCRIPTION_ORDER_CREATED=order-created-notif-sub
PUBSUB_SUBSCRIPTION_PAYMENT_CONFIRMED=payment-confirmed-notif-sub
PUBSUB_SUBSCRIPTION_STOCK_LOW=stock-low-notif-sub
```

---

## 12. Service Communication Map

```
storefront ──WebSocket──► agent-service
storefront ──HTTP──────► Supabase (products, orders, auth)

agent-service ──HTTP──► Supabase (products search, user_preferences)
agent-service ──HTTP──► ml-service (/recommend)
agent-service ──HTTP──► mpesa-service (/stk-push)
agent-service ──Pub/Sub► agent.intent (record interactions)

ml-service ──Pub/Sub──► order.created (training signal)
ml-service ──Pub/Sub──► recommendation.ready (push to storefront)
ml-service ──HTTP──────► Supabase (read order history)

mpesa-service ──HTTP──► Safaricom Daraja API
mpesa-service ──Pub/Sub► payment.initiate (trigger STK Push)
mpesa-service ──Pub/Sub► payment.confirmed (on callback)
mpesa-service ──Pub/Sub► payment.failed (on timeout/rejection)

notif-service ──Pub/Sub► order.created (send confirmation email)
notif-service ──Pub/Sub► payment.confirmed (send receipt email)
notif-service ──Pub/Sub► stock.low (alert admin)
notif-service ──HTTP──► Resend API
```

---

## 13. Known Issues & Debt

### 13.1 Critical (Blocking)

| Issue | Location | Fix |
|-------|----------|-----|
| AudioContext created before WebSocket opens | `ConciergeVoice.tsx:112` | Move AudioContext instantiation inside `ws.onopen` |
| `get_concierge_context` tool missing from conciergeTools array | `agent-service/tools.ts` | Add `getConciergeContextTool` to exports and `conciergeTools` |
| pgvector embeddings not seeded | Supabase `products.embedding` | Run `scripts/generate-embeddings.js` |
| Price display bug: 13000 showing as 13 | `ProductPageClient.tsx` | Remove all `/100` divisions — prices are stored in KES not cents |

### 13.2 High Priority

| Issue | Location | Fix |
|-------|----------|-----|
| `compare_products` tool not implemented | `agent-service/tools.ts` | Build per Section 9.3 |
| Research agent not wired to conciergeAgent | `agent-service/agent.ts` | Add `AgentTool({ agent: researchAgent })` |
| Product images missing for most products | Supabase `products.images` | Upload images, update records |
| ML service untested end-to-end | `apps/ml-service` | Test `/recommend` endpoint manually |
| No end-to-end purchase test completed | Full stack | Complete one full purchase flow |
| Session persistence lost on agent-service restart | `InMemorySessionService` | Upgrade to Supabase-backed session service |

### 13.3 Medium Priority

| Issue | Location | Fix |
|-------|----------|-----|
| UI/UX inconsistency between store and PDP | storefront | Align PDP to store design system |
| WhatsApp CTA button missing | PDP + Cart | Build `WhatsAppCTA.tsx` component |
| Order tracking page missing | storefront | Build `app/track/page.tsx` |
| Manual till + cash payment options | checkout | Add to `checkout-client.tsx` |
| Domain not connected | DNS | Point trovestak.com to Cloud Run storefront URL |
| Checkout UI not triggering M-Pesa | checkout | Wire `initiateCheckoutTool` to checkout flow |

### 13.4 Low Priority (Post-Launch)

| Issue | Notes |
|-------|-------|
| Duplicate storefront service (`trovestak-storefront` vs `storefront`) | Delete `trovestak-storefront` from Cloud Run |
| Duplicate codebase at `~` vs `~/trovestak` | Normalize — all work from `~/trovestak` |
| `storefront` Dockerfile in `~/apps/storefront` is wrong | It's the notif-service Dockerfile — irrelevant since real code is in `~/trovestak` |
| Vulnerability scanning disabled in Artifact Registry | Enable `containerscanning.googleapis.com` |
| Session service is in-memory | Upgrade to persistent session storage |

---

## 14. Roadmap

### Phase 1 — Hackathon Demo (Due March 16, 2026)
- [ ] Fix AudioContext lifecycle bug in ConciergeVoice.tsx
- [ ] Add `getConciergeContextTool` to agent tools
- [ ] Wire `researchAgent` to `conciergeAgent` via `AgentTool`
- [ ] Verify WebSocket connection end-to-end on localhost
- [ ] Test voice: "I need a phone under 50,000 shillings"
- [ ] Deploy updated agent-service to Cloud Run
- [ ] Record 4-minute demo video
- [ ] Write Devpost submission
- [ ] Create architecture diagram
- [ ] Record GCP deployment proof

### Phase 2 — Live Launch (Week of March 17)
- [ ] Fix price display bug on PDP
- [ ] Upload product images for all 175 products
- [ ] Run embedding generation script (175 products × 650ms ≈ 2 mins)
- [ ] Complete one end-to-end purchase test
- [ ] Add WhatsApp CTA to PDP and cart
- [ ] Add manual till and cash payment options
- [ ] Connect trovestak.com domain
- [ ] Fix PDP/store UI consistency
- [ ] Deploy storefront with all fixes

### Phase 3 — AI Enhancement (Weeks 2-3 Post Launch)
- [ ] Implement `compare_products` tool
- [ ] Build order tracking page
- [ ] Implement `initiate_checkout` tool with live M-Pesa
- [ ] Add interaction recording to Pub/Sub (feed ML model)
- [ ] Test ML service recommendations end-to-end
- [ ] Upgrade session service to persistent Supabase backend
- [ ] Add item curation step (Gemini reviews results before presenting)

### Phase 4 — Scale & Moat (Month 2+)
- [ ] Admin AI product entry connected to actual admin panel
- [ ] Taste profile auto-update from browsing behavior
- [ ] TroveVoice as embeddable widget for third-party stores
- [ ] Multi-language support (Swahili)
- [ ] Analytics dashboard for admin
- [ ] A/B testing framework for concierge responses

---

*Document maintained by the TroveStack engineering team. Last updated: March 2026.*
*For questions: reference this document before asking — most answers are here.*
