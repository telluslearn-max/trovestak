# Current Feature

## Active Task: Website Copy Implementation — Phase 2

**Status:** Started (Phase 1 committed, Phase 2 in progress)
**Branch:** `feature/website-copy`
**Priority:** P1 — new components + feature completion
**Context:** Plan file: `WEBSITE_COPY_BRIEF.md`

---

## Phase 1 Summary (Completed ✅)

Commit `576a186`: 12 files modified, all copy/metadata/UI fixes
- HeroSection, PromoPair, ExploreCarousel, ConciergeStrip, Footer, Account pages, Deals page
- Type check: PASSED
- Database: HEALTHY (tested + verified)

---

## Phase 2 Task Checklist

### Task 1: Create "Coming to Trovestak" Section Component
**Purpose:** Display upcoming products + new arrivals with specs, notifications, pre-order CTAs

**Component:** `apps/storefront/src/components/ComingToTrovestak.tsx`

**Requirements:**
- [ ] Create new React component (client-side for interactivity)
- [ ] Two card types: Upcoming Products + New Arrivals
- [ ] Upcoming product card:
  - Product image + name + key spec
  - "Read specs ›" CTA (→ `/products/[slug]#specs`)
  - "Notify me" CTA (subscribe to price/availability alerts)
  - "Pre-order" CTA (Pro members only, shows lock icon for non-Pro)
  - Expected availability date if known
- [ ] New arrivals card:
  - Product image + name
  - "New" badge (top-right corner)
  - "Shop now ›" CTA
- [ ] Section heading: "Coming to Trovestak."
- [ ] Grid layout (responsive: 1 col mobile, 2-3 cols desktop)
- [ ] Motion animations (fade-in on scroll)

**Data source:**
- Upcoming products: `metadata->is_coming_soon = true`
- New arrivals: Created within last 7 days + `status = 'published'`
- Query: Fetch from products table with filters

**Placement:** Homepage, after PromoPair, before ExploreCarousel

---

### Task 2: Create Saves Feature (Wishlist Rename)
**Purpose:** Bookmark/save products for later, with price-drop alerts

**Changes needed:**

#### A. Rename Route & Update UI
- [ ] Route: `/wishlist` → keep URL but rename in UI to "Saves"
- [ ] Icon: Heart ❤️ → Bookmark 🔖 (change lucide icon)
- [ ] Label: "Wishlist" → "Saves" everywhere in UI
- [ ] Update navbar: Cart label "Bag", Wishlist label "Saves"

#### B. Update Page Metadata
- [ ] `/app/wishlist/page.tsx` title: "Saves | Trovestak"
- [ ] Description: "Your saved products and price-drop alerts."

#### C. Price-Drop Notifications
- [ ] Add price-drop alert logic (compare current price vs. saved price)
- [ ] Notification channels:
  - In-app: Badge/bell icon on Saves
  - WhatsApp: Auto message via notif-service
  - Email: Auto email via Resend (in notif-service)
- [ ] Trigger: Price drops by 5%+ from when saved

#### D. Component Updates
- [ ] PDP (product detail page): Change heart icon → bookmark icon
- [ ] Update add-to-wishlist → add-to-saves
- [ ] Account page: "Wishlist" → "Saves" in navigation

---

## Testing

- [ ] ComingToTrovestak component renders without errors
- [ ] Upcoming products cards display correctly
- [ ] New arrivals cards display correctly
- [ ] Responsive layout on mobile/tablet/desktop
- [ ] Saves icon changed everywhere (heart → bookmark)
- [ ] Saves page loads + displays saved products
- [ ] Type check: `pnpm tsc --noEmit` (no errors)
- [ ] Git diff review (all changes correct)

---

## Next Steps

1. **Task 1:** Build ComingToTrovestak component
2. **Task 2:** Build Saves feature (rename + icon + notifications)
3. **Test:** Type check + manual verification
4. **Commit:** Phase 2 complete
5. **Merge:** feature/website-copy → main

---

## Previous Work

**Phase 1 (Committed):** Copy alignment, metadata fixes, component rewrites (576a186)
**Microservices (Completed):** Order/catalog/gateway services, Pub/Sub, notifications (feature/store-upgrade)
