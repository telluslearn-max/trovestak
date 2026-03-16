# Trovestak Storefront — Engineering Brief
### Apple Store Standard · Senior HI Review · March 2026

---

## 0. Philosophy — The Apple Standard

Apple doesn't build stores that sell products. It builds environments where products sell themselves.

Three rules that govern every decision in this brief:

1. **The product is the hero.** Store chrome — nav, filters, UI scaffolding — disappears. Only the product exists on screen.
2. **One truth at a time.** Every screen has one job. The homepage introduces one product. The PDP tells one story. The checkout has one next step.
3. **Motion means something.** Nothing animates without communicating. Scroll reveals mean "there's more." Scale-up means "focus here." Spinners are replaced by skeletons.

This brief is a rebuild directive. Every section below documents the current state, the Apple standard, and the exact files to change. Nothing in here is aesthetic preference — it is measurable, testable, and deployable.

---

## 1. Navigation — Apple's Black Bar

**Current state:** Full mega-menu always visible, busy, consumes vertical space.

**Apple standard:**

- Thin `h-12` bar, black (`bg-[#1d1d1f]`), sticky, `backdrop-blur`
- Logo left. 5 category links centered: Smartphones · Laptops · Audio · Gaming · Cameras. Search + cart icon right.
- On scroll down: bar fades to transparent. On scroll up: reappears with `backdrop-blur-xl bg-black/80`.
- Hover on category: full-width dropdown panel fades in below bar — dark background, product images in a 3-col grid, no bullets, no borders.
- Mobile: hamburger opens full-screen overlay sliding in from left. Same dark theme.

**Files to change:**
- `apps/storefront/src/components/category-nav.tsx` — rebuild
- `apps/storefront/src/components/StorefrontWrapper.tsx` — mount new nav

---

## 2. Homepage — One Hero, One Story

**Current state:** Rotating carousel with multiple products. Bento grid cards below.

### Hero Section

- Full viewport height (`min-h-screen`), full-bleed image, no container constraints
- One product. Large white text on dark background OR black text on white — product photography defines the palette
- Headline: bold, 72px desktop / 40px mobile. One line. "Galaxy S25 Ultra. The next big thing."
- Subline: 24px, gray, max 12 words
- Two CTAs: "Shop now" (filled, white on black) + "Learn more" (ghost)
- Scroll indicator: subtle animated chevron at bottom
- Hero product is admin-configurable via existing `hero_banners` table or product `is_featured` flag

### Below Fold — Category Grid

- 2×4 grid, full-width tiles
- Each tile: product photography, category name only. No price on the tile.
- Hover: subtle `scale(1.02)`, 300ms ease

### Below That — Featured Product Feature Sections

- Pick 1–2 hero products. Full-width alternating sections:
  - Left: large product image or video loop
  - Right: headline + 2-line description + "Shop" link
  - Background alternates white / near-black
- Scroll-triggered fade-in via `IntersectionObserver` — no library needed

**Remove:** rotating carousel, bento grid with busy text, any card showing more than product + name.

**Files to change:**
- `apps/storefront/src/app/page.tsx` — rebuild
- `apps/storefront/src/components/hero-carousel.tsx` — replace with static hero component
- `apps/storefront/src/components/bento-card.tsx` — replace with feature-section component

---

## 3. Product Grid (Store / Category Pages) — Breathe

**Current state:** 4-col grid with price, rating stars, badges, sale ribbon overlays.

**Apple standard:**

- `max-w-7xl mx-auto px-4` container
- 3-col desktop, 2-col tablet, 1-col mobile
- Each card:
  - White background, `rounded-2xl`, zero border
  - Product image: white/neutral bg, centered, 80% of card height, `object-contain`
  - Below image: brand name (gray, 12px, uppercase), product name (black, 16px, font-medium), "From KES X" (gray, 14px)
  - No star ratings in the grid. No sale ribbons. No "Add to cart" button in the grid.
  - Hover: image scales 1.04 over 400ms. Zero other change.
- Filter bar: single horizontal row **above** the grid (not sidebar). Pills: Category · Brand · Price Range · Sort. Active filter = filled black pill with white ×.
- **No sidebar. Ever.**

**Files to change:**
- `apps/storefront/src/app/store/page.tsx`
- `apps/storefront/src/app/category/[slug]/page.tsx`
- `apps/storefront/src/components/store-filters.tsx` → replace with top-bar filter component

---

## 4. Product Detail Page — The Apple PDP

This is the most important change in the brief. Apple's PDP is a long-form editorial page, not a form.

### Section 1 — Hero

- Full-width, white or near-black background
- Large centered product image (or image gallery with thumbnail row)
- Product name: `text-5xl font-bold tracking-tight` centered
- Tagline from `short_desc`: `text-xl text-gray-500` centered
- Price: `text-2xl font-semibold` centered
- CTA row: [Add to Cart] [Buy Now — M-Pesa]

### Section 2 — Variant Picker (sticky configuration bar)

- Color: visual swatch circles (render hex from variant color string), selected = black ring
- Storage/RAM: pill buttons, selected = black fill
- When variant selected → price updates, stock badge updates
- This bar becomes `position: sticky top-12` after scrolling past Section 1

### Section 3 — Feature Sections (editorial)

- Pull top 3 `highlights` from product data
- Each highlight: full-width section, alternating white / near-black
- Format: large icon or product close-up photo left, benefit headline + 1 sentence right
- Text size: 48px headline, 18px body
- Scroll-triggered fade-up reveal (IntersectionObserver, no GSAP)

### Section 4 — "Why [Product Name]" Icon Grid

- 6-tile grid: icon + label + 1-line description
- Pull from `highlights[]`
- Background: `#f5f5f7` (Apple's signature light gray)

### Section 5 — Tech Specs

- Collapsible accordion by spec group
- Clean table: spec name left, value right, `border-b border-gray-100`
- "See full specifications" expands all
- No overwhelming spec dump above the fold

### Section 6 — Buy Box (always visible below fold)

- Sticky bar: `position: fixed bottom-0` on mobile, appears after hero scrolls out of view on desktop
- Shows: thumbnail, product name, selected variant, price, [Add to Cart]
- Dismissible? No. It is always there.

### Section 7 — Also Consider

- 4 related products in horizontal scroll row (same `nav_category`)
- Same minimal card style as store grid

**Files to change:**
- `apps/storefront/src/app/products/[slug]/page.tsx`
- `apps/storefront/src/app/products/[slug]/ProductPageClient.tsx` — major rewrite
- `apps/storefront/src/components/product-view.tsx`

---

## 5. Cart — Drawer, Not Page

**Current state:** Dedicated `/cart` page.

**Apple standard:**

- Cart is a right-side `Sheet` (shadcn) that slides in over the page
- No navigation away from the page. The page darkens behind the drawer.
- Inside: item list (image, name, variant, price, qty controls), order subtotal, VAT toggle, trade-in credit display, "Checkout" button
- The `/cart` page remains as fallback for mobile full-screen, but default is drawer
- Cart icon in nav shows item count badge (Zustand store already tracks this)

**Files to change:**
- `apps/storefront/src/components/category-nav.tsx` — wire cart icon to Sheet
- `apps/storefront/src/app/cart/page.tsx` — keep as fallback, simplify
- Add: `apps/storefront/src/components/CartDrawer.tsx` — new Sheet component

---

## 6. Checkout — Apple Pay Speed, M-Pesa Reality

**Current state:** Two-step wizard, separate shipping and payment pages.

**Apple standard adapted for Kenya:**

One page. Three visible sections at once — no wizard tabs:

```
[1] Contact & Delivery
    Name · Email · Phone · Address · County → shipping rate auto-fills

[2] Payment
    [M-Pesa — Pay KES X]  ← primary, full-width, black button
    [Manual Till]  [Cash on Delivery]  ← secondary options below

[3] Order Summary  (always visible right column on desktop, collapsible on mobile)
    Items · Subtotal · Shipping · VAT · Total
    Discount code field
```

**M-Pesa inline flow:**

- Click "Pay KES X" → button becomes spinner + "Sending M-Pesa prompt..." — no new page
- Phone number input appears inline below the button if not already filled
- After STK fires: "Check your phone. Enter your M-Pesa PIN." with animated phone icon
- Success → inline: green checkmark, order number shown, "View your order" link
- Timeout → inline: "Taking longer than expected. [Check payment status] [Try again]" — **this is the recovery UI currently missing**

**Bug fixes required in this section:**
- Order confirmation: pass real `orderId` as query param and display actual order details
- Cart validation: fix `is_active` → `status = 'published'`
- Timeout recovery: add explicit retry path

**Files to change:**
- `apps/storefront/src/app/checkout/checkout-client.tsx` — major redesign
- `apps/storefront/src/app/order-confirmation/page.tsx` — real data display
- `apps/storefront/src/app/checkout/actions.ts` — fix status mismatch

---

## 7. Search — Spotlight Overlay

**Current state:** Dedicated `/search` page with hardcoded trending terms.

**Apple standard:**

- Click search icon → full-screen dark overlay slides down from top (`animate-in slide-in-from-top`)
- Search input autofocused, white on dark
- Below input: "Trending" (dynamic — top 5 from DB) + "Recent searches" (localStorage)
- As you type → instant results appear below input (server action, 300ms debounce)
- Results show: product image (40px), name, category, price — no separate results page needed
- ESC or click outside → overlay dismisses
- "See all results for X" → navigates to `/search?q=X` (full page still exists as fallback)

**Bug fix included:** Replace hardcoded trending searches with query from analytics or a `search_trending` admin-configurable table.

**Files to change:**
- `apps/storefront/src/components/category-nav.tsx` — mount search overlay
- Add: `apps/storefront/src/components/SearchOverlay.tsx`
- `apps/storefront/src/app/search/search-content.tsx` — keep for full-page results fallback
- Fix: price division bug in `apps/storefront/src/app/search/actions.ts`

---

## 8. Typography & Color System — One Design Token Pass

Apply Apple's type scale and color palette via `tailwind.config.ts`. No per-component color decisions after this pass.

```css
/* Type scale */
.text-display  { font-size: 80px;  font-weight: 700; letter-spacing: -0.015em; line-height: 1.05 }
.text-headline { font-size: 48px;  font-weight: 700; letter-spacing: -0.01em;  line-height: 1.1  }
.text-title    { font-size: 32px;  font-weight: 600; letter-spacing: -0.005em; }
.text-body     { font-size: 17px;  font-weight: 400; line-height: 1.6 }
.text-caption  { font-size: 12px;  font-weight: 400; color: #6e6e73 }

/* Color palette */
--color-text-primary:    #1d1d1f;   /* Apple near-black */
--color-text-secondary:  #6e6e73;   /* Apple gray */
--color-bg-base:         #ffffff;
--color-bg-secondary:    #f5f5f7;   /* Apple signature light gray */
--color-bg-dark:         #1d1d1f;
--color-accent:          #0071e3;   /* Apple blue — links and secondary CTAs only */
--color-cta-primary:     #000000;   /* Black buttons */
```

**File to change:** `apps/storefront/tailwind.config.ts`

---

## 9. Motion System — Intentional Only

Three animation primitives. Nothing else.

```typescript
// 1. Scroll reveal — all content below the fold
const scrollReveal = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-100px' },
    transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }
}

// 2. Hover lift — product cards only
const hoverLift = { whileHover: { scale: 1.03 }, transition: { duration: 0.3 } }

// 3. Page transition — route changes
// Wrap layout in AnimatePresence with opacity 0→1, 200ms
```

Framer Motion is already in the project. No new dependencies.

**Remove:** spinning loaders (replace with skeletons), bounce animations, slide-in-from-everywhere on initial load.

**File to add:** `apps/storefront/src/lib/motion.ts`

---

## 10. Data / Bug Fixes (Non-Negotiable)

These bugs break the visual redesign if not fixed first. Fix all 10 before touching any component.

| # | Fix | File | Why it matters |
|---|-----|------|----------------|
| 1 | `status = 'published'` in cart validation | `src/app/checkout/actions.ts:~148` | Products fail validation at checkout |
| 2 | `status = 'published'` in category queries | `src/app/category/[slug]/page.tsx` | Products don't appear in category pages |
| 3 | `status = 'published'` in search queries | `src/app/search/actions.ts` | Products don't appear in search |
| 4 | Remove `/100` in search min price | `src/app/search/actions.ts:~92` | Prices show KES 1.30 instead of KES 130 |
| 5 | Remove `/100` in wishlist sync | `src/stores/wishlist.ts:~139` | Wishlist prices wrong |
| 6 | Brand filter: `.eq('brand', brand)` not ILIKE | `src/app/category/[slug]/page.tsx:~138` | Brand pages show wrong products |
| 7 | Order confirmation: real `orderId` from query param | `src/app/order-confirmation/page.tsx` | Fake order number shown after payment |
| 8 | M-Pesa timeout recovery UI | `src/app/checkout/checkout-client.tsx` | User has no path after 2-min poll fails |
| 9 | Forgot password page | `src/app/auth/forgot-password/page.tsx` (create) | Auth flow has broken link |
| 10 | Admin orders: `customer_name` from order record, not profile join | `src/app/admin/orders/page.tsx` | Guest orders show blank customer name |

---

## 11. Execution Order

```
Phase 1 — Foundation  (no visual output yet)
  Step 1   Fix all 10 data/bug fixes above                              [1 day]
  Step 2   Apply design token pass to tailwind.config.ts                [2h]
  Step 3   Set up motion primitives in lib/motion.ts                    [1h]

Phase 2 — Navigation + Shell
  Step 4   Rebuild category-nav.tsx (Apple black bar + scroll behavior) [4h]
  Step 5   Build CartDrawer.tsx (shadcn Sheet component)                [3h]
  Step 6   Build SearchOverlay.tsx                                      [4h]

Phase 3 — Homepage
  Step 7   Rebuild hero section (full-bleed, single product)            [3h]
  Step 8   Build category grid tiles                                    [2h]
  Step 9   Build alternating feature sections (scroll reveal)           [3h]

Phase 4 — Store Grid + Category Pages
  Step 10  Rebuild product card (minimal, Apple style)                  [2h]
  Step 11  Rebuild top-bar filter (replace sidebar)                     [3h]
  Step 12  Apply to store page + category pages                         [2h]

Phase 5 — PDP
  Step 13  Build hero section + sticky variant picker                   [4h]
  Step 14  Build editorial feature sections (pull from highlights)      [3h]
  Step 15  Build sticky buy bar (fixed bottom)                          [2h]
  Step 16  Rebuild spec accordion                                       [2h]

Phase 6 — Checkout
  Step 17  Rebuild checkout as single page (3 visible sections)         [4h]
  Step 18  Build inline M-Pesa flow + timeout recovery                  [3h]
  Step 19  Build real order confirmation page                           [2h]

Phase 7 — Polish
  Step 20  Apply scroll reveal to all editorial sections                [2h]
  Step 21  Forgot password flow                                         [2h]
  Step 22  Admin orders: guest customer fix + pagination                [2h]
```

---

## 12. What NOT to Change

| Area | Reason |
|------|--------|
| Zustand cart/compare/wishlist stores | Logic is correct |
| `checkout/actions.ts` server actions | Logic is correct after bug fixes |
| Admin panel design | This brief is storefront only |
| Agent service / TroveVoice | Separate concern |
| Supabase schema | No migrations needed for visual rebuild |
| Email templates | Untouched |
| `packages/shared/` | Untouched |

---

## Verification Checklist

1. **Homepage:** Full-bleed hero visible above fold, no carousel, single product featured
2. **Category page:** 3-col grid, no sidebar, top filter bar, cards show image + name + "From KES X" only
3. **PDP:** Sticky variant picker visible on scroll, 3 editorial feature sections, sticky buy bar appears after hero exits viewport
4. **Add to cart:** Sheet slides in from right, no page navigation
5. **Checkout:** Single-page layout, M-Pesa button prominent, inline payment flow, real order number at confirmation
6. **Search:** Dark overlay slides down on icon click, instant results as you type, ESC dismisses
7. **Scroll animations:** Content reveals with 700ms fade-up on every below-fold section
8. **Mobile:** Nav collapses to hamburger, cart drawer is full-screen sheet, checkout is single-column
