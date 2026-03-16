# Current Feature

## Active Task: Concierge & ML Handover

**Status:** Complete — ready for review
**Branch:** `feature/store-upgrade`
**Priority:** P1 — TroveVoice memory + recommendations

### What We Built

Fixed all broken TroveVoice concierge functionality: behavioral tracking, taste memory, ML recommendations, and page-context awareness.

### Step Progress

| Step | Description | Status |
|------|-------------|--------|
| 1 | Create 3 missing Supabase tables (user_events, user_preferences, user_taste_profiles) | ✅ Done |
| 2 | Replace Python ML service with pgvector SQL RPC + update getMlRecommendationsTool | ✅ Done |
| 3 | Wire pageContext into WebSocket (useAudioPipeline, ConciergeStrip, index.ts) | ✅ Done |
| 4 | Fix CategoryTracker + pass categoryId in ProductPageClient | ✅ Done |
| 5 | getConciergeContextTool derives preferences from user_events | ✅ Done |
| 6 | Add tool call logging in index.ts | ✅ Done |

### Key Files

- `supabase/migrations/20260317000000_add_user_tracking.sql` — 3 missing tables
- `supabase/migrations/20260317000001_add_recommendations_rpc.sql` — pgvector SQL recommendations
- `apps/agent-service/src/tools.ts` — getMlRecommendationsTool → Supabase RPC; getConciergeContextTool → derive from events
- `apps/agent-service/src/index.ts` — context message handler; Gemini context injection; tool logging
- `apps/storefront/src/hooks/useAudioPipeline.ts` — pageContext param; send on WS open
- `apps/storefront/src/components/concierge/ConciergeStrip.tsx` — pass pageContext to useAudioPipeline
- `apps/storefront/src/components/concierge/CategoryTracker.tsx` — accept productId prop
- `apps/storefront/src/app/products/[slug]/ProductPageClient.tsx` — pass categoryId to useConciergeTracker

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
