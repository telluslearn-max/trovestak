# Current Feature

## Active Task: End-to-End Voice Flow Test

**Status:** In Progress
**Branch:** `main` (test-only, no code changes expected unless bugs surface)
**Priority:** P0 — Hackathon demo

### What We're Testing

Full TroveVoice chain:
1. User speaks a vague query → `researchAgent` expands to 5 specific queries
2. `search_products` runs semantic search → returns results
3. User asks to compare two products → `compare_products` called
4. User says "I'll take it" → `initiate_checkout` fires M-Pesa STK Push

### Test Scenarios

| # | Utterance | Expected tool | Expected outcome |
|---|-----------|--------------|-----------------|
| 1 | "I need a good laptop under 80k shillings" | `research_agent` → `search_products` | 5 product results returned |
| 2 | "Compare the Samsung and the Sony" | `compare_products` | Side-by-side comparison spoken |
| 3 | "I'll take the Sony, my number is 0712345678" | `initiate_checkout` | STK Push triggered |

### Known State Before This Test

- ✅ 173 products embedded (gemini-embedding-001, 768-dim)
- ✅ `match_products()` RPC live in Supabase
- ✅ All 6 tools wired in agent-service
- ✅ researchAgent wired as sub-agent
- ✅ Storefront running on localhost:3000
- ✅ Agent-service running on localhost:8088

### How to Run

```bash
# Terminal 1 — agent-service
cd apps/agent-service && pnpm dev

# Terminal 2 — storefront
cd apps/storefront && pnpm dev

# Then open http://localhost:3000 and click the TroveVoice bubble
```

---

## Completed Tasks

| Task | Branch | Date |
|------|--------|------|
| Seed pgvector embeddings | `fix/seed-embeddings` | 2026-03-15 |
| Fix WhatsApp phone number | `fix/whatsapp-number` | 2026-03-15 |
