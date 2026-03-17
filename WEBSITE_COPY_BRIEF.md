# Trovestak — Website Copy Master Brief
*Assembled from 150+ founder Q&A responses + full codebase audit*

---

## Brand DNA

| Attribute | Confirmed |
|-----------|-----------|
| **Name** | Trovestak (1 word — canonical. Never "TroveStack") |
| **Name meaning** | Trove (treasure) + Stack (tech inventory / stack) |
| **Tagline** | TBD — to be written. Direction: "Shop and Save" is the brand line |
| **TroveVoice slogan** | "Shop by voice. Delivered." |
| **Mission** | "Democratise access to premium tech in Africa" |
| **Founding story** | Everyone gets a shopping concierge. Best products, context and intent matters — built for tool makers and those who make them. |
| **Core promise** | "Genuine products + same-day delivery + AI guidance = zero risk" |
| **Memorable brand line** | "Shop and Save" |
| **Internal principle** | "We are custodians of client trust" — shapes tone, never stated publicly |
| **Brand philosophy** | We build in the shadows. Brilliance in execution. No hype, no announcements. |

### Brand personality
Premium & aspirational · Bold & exciting · Friendly & approachable
Ecosystem-coded — 19-year-old tech-native Kenyan is the trophy client.

### Absolute copy rules
- No corporate/stiff language
- No fake urgency or scarcity
- No competitor name-dropping
- No over-explaining payment methods
- Do NOT draw attention to no physical store
- Do NOT write copy for features not yet live (see feature status table)

---

## Feature Status (Copy Accuracy)

| Feature | Status | Copy rule |
|---------|--------|-----------|
| TroveVoice search + recommendations | Live | Check `/apps/agent-service` code for exact capabilities before claiming |
| TroveVoice full voice checkout | Check code | Verify before claiming end-to-end |
| TroveXP gamification | Future-state | Tease only. "Coming soon." |
| Pro membership | Future-state | Waitlist CTA only. No perks detail yet. |
| Product insurance (Pro perk) | Concept only | Do NOT write copy for it |
| BNPL / TrovePay | Live via unnamed 3rd party | PDP only on eligible products. Show deposit + WhatsApp CTA. Do not name provider. |
| Saves (wishlist rename) | To build | Brief below |
| "Coming to Trovestak" section | To build | Brief below |
| Trade-In programme | Planned | "Coming soon" tease only |
| Gift cards | Planned | "Coming soon" state |
| East Africa delivery | Operational | "Contact us for your country" |
| Starlink authorised | NOT confirmed | Say "Starlink available" only. Never "Authorised Reseller." |
| Starlink installation | NOT offered | Hardware delivery only (dish + router kit) |
| Blog: Trove Guides | Planned | Build section, first guide: TroveVoice onboarding |
| Wake-word ("Hey TroveVoice") | Remove entirely | Delete `useWakeword`. Push-to-talk only. |
| WhatsApp number | Placeholder `254700000000` | Keep until launch. Do not publish yet. |

---

## Target Audience

All four simultaneously:
1. Urban professional 25–40 (Nairobi, KES 80K–200K/mo)
2. Tech-savvy youth 18–28 (aspirational, trend-coded)
3. Family decision-maker 30–50 (household upgrades)
4. SME / business buyer (WhatsApp case-by-case, no B2B page)

**Trophy client:** 19-year-old Kenyan tech native.
**Primary emotional driver:** Quality of life upgrade — "I deserve something that just works."
**Core belief to reframe:** "I need to touch it before I buy it" → TroveVoice consultation replaces the showroom.
**Target post-purchase emotion:** "I want to tell everyone about this." → advocacy + referral.

---

## "Shop and Save" Definition (all four)
- Save money — best prices
- Save time — TroveVoice finds it instantly
- Save effort — no research rabbit holes
- Save regret — buy right the first time

---

## Delivery Copy (Confirmed)

| Zone | Promise |
|------|---------|
| Nairobi | Same-day (order by noon) |
| Major cities (Mombasa, Kisumu) | Next-day |
| Nationwide Kenya | Operational |
| East Africa (Uganda, Tanzania, Rwanda, Burundi, DRC, Sudan) | "We ship across East Africa — contact us for your country" |

Delivery fees: Variable by location + weight — shown at checkout only.

---

## Payment Copy

- M-Pesa STK Push, Card, USDT crypto, COD, Paybill — minimal treatment
- BNPL: PDP only on eligible products (Starlink, Apple, Samsung TVs, select Android). Show initial deposit + WhatsApp CTA.
- Crypto: Discoverable at checkout, not in marketing copy.

**BNPL PDP copy:**
> "Own it now, pay over time. [From KES X deposit →] [Chat to set up on WhatsApp]"

Do NOT name the BNPL provider. Do NOT claim rates/terms.

---

## Page-by-Page Copy

---

### Announcement Banner
Dynamic by detected location:
```
📍 [City] · Same-day delivery · Order by noon
```
Fallback non-Kenya:
```
We ship across East Africa · Contact us for your country
```

---

### Navbar
`Logo | [Categories] | Deals | Ask TroveVoice | 🔍 | My Trove | 🛍 Bag`

- Voice CTA label: **"Ask TroveVoice"**
- Account label: **"My Trove"**
- Cart label: **"Bag"** everywhere (Apple-style, intentional)
- Deals: Always visible in nav

Nav categories (all have real products):
Store · Mobile · Computing · Audio · Gaming · Cameras · Wearables · Smart Home · Deals

---

### Homepage Structure
*(Follows `apple-homepage-v2.html` layout — all tiles product-driven, no brand moment tile)*

1. AnnouncementBanner (if theme active)
2. **HeroSection** — flagship product (default: Starlink)
3. **FeatureTile** — product 1
4. **FeatureTile** — product 2
5. **FeaturedPair** — products 3 + 4
6. **FeatureTile** — product 5 (black bg)
7. **FeatureTile** — product 6 (dark bg)
8. **PromoPair** — Trade-In + TroveXP (see below)
9. **"Coming to Trovestak"** section (see below — replaces ExploreCarousel)
10. ExploreCarousel (category cards — remove TroveVoice card)

---

### Hero Section
**Fallback copy (when no product loaded):**
- Eyebrow: `Trovestak Store`
- Headline: `Kenya's Premium Electronics Store`
- Subline: `Genuine products. AI guidance. Zero risk.`
  *(Remove the current M-Pesa mention from fallback)*
- CTA: `Shop now ›`

**Theme CTA overrides must be wired** (currently not connected in `HeroSection.tsx`):
- Launch: `Order now` / `Learn more`
- Christmas: `Shop Gifts` / `See all gifts`
- Back to school: `Shop bundles` / `Learn more`
- Jamhuri: `Shop now` / `Our story` (keep theme — Kenyan national moment)

**Availability fine print:** Show only for pre-orders and confirmed new launches.

---

### PromoPair (Rewrite — Delete MpesaStrip too)

**Left tile — Trade-In (coming soon):**
- Eyebrow: `Trade In`
- Headline: `Upgrade smarter. Trade in your device.`
- Body: `Get credit toward your next device. Launching soon.`
- CTA: `Coming soon ›`
- Href: `/trade-in`

**Right tile — TroveXP (coming soon):**
- Eyebrow: `TroveXP`
- Headline: `TroveXP. Earn as you shop, rise as you save.`
- Body: `Every purchase earns points. Unlock more.`
- CTA: `Coming soon ›`
- Href: `/account` (or waitlist)

**Delete:** `MpesaStrip` component — remove from codebase.

---

### "Coming to Trovestak" Section *(new feature)*
Replaces the Entertainment section equivalent from the design. Sits after PromoPair.

**Section heading:** `Coming to Trovestak.`

**Two types of cards:**
1. **Upcoming products** (announced, not yet in stock):
   - Product image + name + key spec
   - CTA row: `Read specs ›` · `Notify me` · `Pre-order` (Pro members only)
   - Fine print: expected availability if known
2. **New arrivals** (recently stocked):
   - Product image + name + "New" badge
   - CTA: `Shop now ›`

**ExploreCarousel changes:**
- Remove TroveVoice card (ConciergeStrip is always present)
- Keep category cards: Mobile · Computing · Audio · Gaming · Cameras · Wearables · Smart Home · Deals
- Heading stays: `Explore Trovestak.`

---

### ConciergeStrip
- Visible on all pages **except checkout**
- Idle pill: **"Ask TroveVoice"** (remove wake-word copy and `useWakeword` entirely)
- Loading: `Finding the best options for you...`
- Fail state: connects to WhatsApp — `Let me connect you to our team.`
- Tool badge copy: keep existing (accurate)
- **Fix brand name:** Change all instances of "TroveStack" in system prompt → "Trovestak"

---

### Product Detail Page (PDP)

**Design reference:** Apple.com/store — richer. SEO-first, immersive, intuitive.

**Copy hierarchy per product:**
1. Spec (factual anchor)
2. Outcome (what the spec enables)
3. Intent/benefit (why it matters to them)

**PDP elements:**
- "Ask TroveVoice about this product" CTA
- Use case context: "Great for: students · creatives · remote work"
- Saves button (bookmark icon, top-right)
- Compare CTA
- BNPL on eligible PDPs only (Starlink, Apple, Samsung TVs, select Android):
  > "Own it now, pay over time. [From KES X deposit →]" + WhatsApp button
- Pro teaser:
  > "Pro members unlock exclusive pricing + priority delivery on this product. [Join the waitlist →]"
- **Out of stock:** `[Notify me when available]` — no urgency, just a subscribe button
- Pre-order / upcoming: Show availability date if confirmed + fine print

---

### Brand Pages (`/brand/[slug]`)
Full landing pages. Apple-style minimal product showcase — let products speak.

**Copy formula per brand:**
`[Brand name]` + `[Every [brand] product. Genuine. Delivered.]`

**Apple specifically:** Pure product showcase. No brand editorial copy.
**Samsung:** `Samsung at Trovestak. Every Galaxy. Genuine.`
**Starlink:** `Starlink is here. Hardware delivered. Subscription activated.`
*(Note: hardware + subscription activation only — no on-site physical installation)*

---

### Deals Page
- Metadata: `Today's deals. Tomorrow's are different.`
- Header: `Real Deals. No Inflation.`
- Sub-copy: `We only discount what we actually discount.`
- Format: Deal of the Day — one product, 24hr auto-rotation
- Price-drop alerts: "Price dropped!" → in-app bell + WhatsApp + email

---

### Checkout Page
- No ConciergeStrip
- Micro-copy: contextual delivery ETA
  > "Arrives today if you order in the next 2h 14m"
- Payment labels minimal: M-Pesa · Card · Crypto · COD · Pay later (eligible items only)

---

### Order Confirmation Screen
**Primary CTA:**
> "Share with a friend, earn referral credit →"

**Order statuses (brand-native everywhere):**
`Confirmed` · `Preparing` · `On the way` · `Delivered`

**Post-order comms:**
- WhatsApp tracking updates
- Auto receipt on payment confirmation
- In-app + Trustpilot + Google Review prompt at 8 days post-purchase (earns TroveXP when live)

---

### My Trove (Account Dashboard)
**Greeting:** `Welcome back, [Name].`

**Metadata (replace sci-fi language):**
- Page title: `My Trove | Trovestak`
- Description: `Your orders, saves, devices and account settings.`
- Devices page title: `My Devices | Trovestak`
- Devices description: `Manage your registered devices, warranty products, and TroveVoice preferences.`

**Account sections:**
1. Orders (`Confirmed · Preparing · On the way · Delivered`)
2. Saves (bookmark icon — price-drop alerts via in-app + WhatsApp + email)
3. Devices (login sessions + warranty products + TroveVoice device preferences)
4. TroveXP score (tease — "coming soon" label)
5. Pro membership waitlist CTA
6. Addresses + payment methods
7. Referral (footer/account only, quiet)

---

### Saves Feature *(rename from /wishlist)*
- Route: `/wishlist` → rename to "Saves" in UI (keep URL or redirect)
- Icon: Bookmark (not heart)
- Label: "Saves" everywhere
- Behaviour: Passive — TroveVoice does NOT proactively reference saves
- Price-drop notification: "Price dropped!" → in-app bell + WhatsApp message + email

---

### TroveXP & Pro (Future-State — Tease Only)
**XP name:** TroveXP (public-facing)

**On PDP:**
> "Pro members unlock exclusive pricing + priority delivery on this product. [Join the waitlist →]"

**Pro waitlist requirements:** Must have at least one purchase. Prompts OAuth + delivery details.

**Pro perks to tease (4 — NO insurance copy):**
- Exclusive member pricing
- Priority / white-glove delivery
- Extended warranties
- Request Imports (Pro-only, not marketed publicly — ex-UK tech, phones primary)
- Pre-order access (new — from "Coming to Trovestak" section)

---

### Sign-Up Page
**Headline:** `Shop smarter. Sign up free.`
**Left panel body:** Keep existing: unlock deals, track orders, personalised recommendations.

---

### About Page
**Tone:** Technical credibility. Vision-forward.
**Headline:** `Built for Africa. No announcements. Just results.`

**Body direction:**
- Mission: democratise premium tech access
- Founding: everyone deserves a personal concierge, not just the privileged
- TroveVoice: Gemini Live AI, voice-first, context-aware — first-of-its-kind in Kenya
- "We build in the shadows. Brilliance in execution and client satisfaction."
- Online-only, nationwide Kenya, East Africa expanding

---

### "Coming to Trovestak" & New Arrivals
- Upcoming: specs-first cards + Notify me + Pre-order (Pro only)
- New arrivals: "New" badge + `Shop now ›`
- Section heading: `Coming to Trovestak.`

---

### Trove Guides (Blog)
- Section name: `Trove Guides`
- First guide: "How to use TroveVoice to shop smarter"
- Medium: Technical/builder content
- Trove Guides: End-user buying guides and how-tos

---

### FAQ Page
Static (SEO + accessibility). Top 5 Qs + "Ask TroveVoice for anything else" CTA.

---

### 404 Page
```
This page doesn't exist.
TroveVoice knows where everything else is. [Start a conversation →]
```

### Error Page (500)
```
Something went wrong. Ask TroveVoice while we fix this. [Ask TroveVoice →]
```

### Empty Cart ("Bag")
```
Your bag is empty. TroveVoice can help. [Ask TroveVoice →]
```

---

### Footer
**Correct social set:** TikTok · Twitter/X · Instagram · WhatsApp · Medium
*(Remove LinkedIn — not active)*

**Links:** About · Contact (WhatsApp + Email) · Returns & Warranty · Referral (quiet) · Trove Guides · FAQ
**East Africa copy:** `We ship across East Africa — contact us for your country.`
**Returns policy:** `Returns accepted for damaged or defective items on arrival. Contact us within 7 days.`
**Copyright:** `Copyright © [year] Trovestak Ltd. All rights reserved.`

---

## Copy Corrections (Fix Existing Code)

| Location | Current (wrong) | Fix |
|----------|-----------------|-----|
| `ConciergeStrip.tsx` system prompt | "TroveStack" | → "Trovestak" |
| `HeroSection.tsx` subline fallback | "Shop by voice, pay with M-Pesa, delivered across Kenya." | → "Genuine products. AI guidance. Zero risk." |
| `layout.tsx` metadata description | "Your trusted source for premium electronics in Kenya" | → outcome-led copy |
| `HeroSection.tsx` | theme `primaryCta`/`secondaryCta` not wired | Wire theme CTAs |
| `PromoPair.tsx` | Trade-In + M-Pesa BNPL copy | → Trade-In (coming soon) + TroveXP (coming soon) |
| `MpesaStrip.tsx` | Entire component | → Delete |
| `ConciergeStrip.tsx` | wake-word copy + `useWakeword` hook | → Remove entirely, push-to-talk only |
| `ExploreCarousel.tsx` | TroveVoice card (`/#trove-voice-cta`) | → Remove card |
| `account/page.tsx` metadata | "Prime Account", "command center for acquisitions" | → clean consumer copy |
| `account/devices/page.tsx` metadata | "Real-time status and technical matrix" | → clean consumer copy |
| `Footer.tsx` | LinkedIn social link | → Replace with Medium + add TikTok |
| `SearchOverlay.tsx` | Trending searches (hardcoded) | → Include Starlink in trending |
| `deals/page.tsx` metadata description | "Deals expire daily — grab them before they're gone." | → "Today's deals. Tomorrow's are different." |
| `navbar.tsx` mega menu | Hardcoded product copy (iPhone 16 Pro etc.) | → verify these match actual catalog |

---

## SEO Direction

**Meta description tone:** Outcome-led.
**Site-level description:** `Kenya's voice-powered electronics store. Genuine products, AI-guided shopping, same-day delivery. Shop and Save.`

**Key terms to own:**
- "buy Starlink Kenya"
- "genuine iPhone Nairobi"
- "voice shopping Kenya"
- "same day electronics delivery Nairobi"
- "buy Samsung TV Kenya"

---

## Complete Copy Assets Checklist

**Brand:**
- [ ] Tagline (3–5 options)
- [ ] Site-level meta title + description
- [ ] Homepage hero fallback copy (updated)
- [ ] TroveVoice slogan: "Shop by voice. Delivered."
- [ ] "Ask TroveVoice" navbar label confirmed

**Homepage:**
- [ ] Hero subline fallback fixed
- [ ] PromoPair rewrite (Trade-In + TroveXP)
- [ ] "Coming to Trovestak" section heading + card CTA copy
- [ ] ExploreCarousel TroveVoice card removed
- [ ] MpesaStrip deleted

**Page templates:**
- [ ] PDP copy formula (spec → outcome → intent) + BNPL + Saves + Pro teaser
- [ ] Brand page template (5 brands minimum: Apple, Samsung, Starlink, Sony/LG, HP/Dell)
- [ ] Deals page header + metadata
- [ ] Checkout ETA micro-copy
- [ ] Order confirmation referral CTA
- [ ] Order status labels (4 stages)

**Account area:**
- [ ] My Trove greeting
- [ ] Account + Devices page metadata (clean copy replacing sci-fi)
- [ ] TroveXP "coming soon" label
- [ ] Pro waitlist CTA

**Auth:**
- [ ] Sign-up headline: "Shop smarter. Sign up free."

**Future-state teases:**
- [ ] Trade-In tile copy (coming soon)
- [ ] TroveXP tile copy (coming soon)
- [ ] Pro membership perks (4 perks — no insurance)
- [ ] Gift cards coming soon state

**Utility pages:**
- [ ] About page full body
- [ ] FAQ top 5 Qs + answers
- [ ] 404 page
- [ ] Error page (500)
- [ ] Empty bag
- [ ] OOS: "Notify me when available"
- [ ] Announcement banner (dynamic + EA fallback)

**Corrections:**
- [ ] Fix "TroveStack" → "Trovestak" in system prompt
- [ ] Wire hero theme CTAs in HeroSection.tsx
- [ ] Footer social links: remove LinkedIn, add TikTok + Medium
- [ ] Remove useWakeword + wake-word copy from ConciergeStrip

**Content:**
- [ ] Trove Guides section header
- [ ] First guide: TroveVoice onboarding intro
- [ ] Blog/Guides section homepage placement

**SEO:**
- [ ] Meta titles + descriptions for all key pages

---

## Verification
1. `ideas/TROVESTAK_AI_BIBLE.md` — confirm copy aligns with canonical spec
2. `ideas/ux/apple-homepage-v2.html` — use as layout/section reference
3. `apps/agent-service/src/tools.ts` + `agent.ts` — verify TroveVoice capabilities before claiming
4. `apps/storefront/src/app/` — all page files for copy to preserve or replace
5. DB `nav_category` values — confirm category names match
6. `tsc --noEmit` after copy changes
7. Browser review — premium/minimal feel, all breakpoints
