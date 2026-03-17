# Current Feature

## Active Task: Website Copy Implementation — Phase 1 Complete

**Status:** 10 of 13 tasks done. Ready for commit.
**Branch:** `feature/website-copy`
**Priority:** P1 — brand alignment + customer-facing accuracy
**Context:** Plan file: `WEBSITE_COPY_BRIEF.md`

---

## Task Checklist

### Completed (10/13)
- [x] Update HeroSection.tsx line 31: Fallback subline → "Genuine products. AI guidance. Zero risk."
- [x] Update layout.tsx line 10: Metadata description → outcome-led copy + "Shop and Save"
- [x] Delete MpesaStrip component entirely
- [x] Rewrite PromoPair.tsx (Trade-In: "coming soon" + TroveXP: "coming soon")
- [x] Remove TroveVoice card from ExploreCarousel.tsx
- [x] Fix ConciergeStrip.tsx: Change "TroveStack" → "Trovestak" throughout system prompt (5 instances)
- [x] Remove `useWakeword` hook and wake-word copy from ConciergeStrip.tsx (push-to-talk only)
- [x] Update account/page.tsx metadata (title: "My Trove", description: clean consumer copy)
- [x] Update account/devices/page.tsx metadata (description: clean consumer copy)
- [x] Fix Footer.tsx: Remove LinkedIn, add TikTok + Medium to social links
- [x] Update deals/page.tsx metadata: Remove fake urgency ("Today's deals. Tomorrow's are different.")
- [x] Wire hero theme CTAs in HeroSection.tsx (primaryCta/secondaryCta from theme now active)

### Not Started (2 remaining — Phase 2)
- [ ] Create "Coming to Trovestak" section component (new products + new arrivals)
- [ ] Create Saves feature (rename /wishlist, bookmark icon, price-drop alerts via in-app + WhatsApp + email)

---

## Testing
- ✅ tsc --noEmit: PASSED (no type errors)
- 🔄 pnpm install: Running in background
- [ ] Browser test: All pages render correctly
- [ ] Copy review: All metadata and copy changes applied correctly

---

## Next Steps
1. Complete pnpm install
2. Review all code changes
3. Commit Phase 1 with message
4. Begin Phase 2 (two new components)

---

## Previous Work (Microservices Migration)

See git log for `feature/store-upgrade` (2026-03-17). All phases complete: order-service, catalog-service, API gateway, Pub/Sub activation, notif-service delivery.
