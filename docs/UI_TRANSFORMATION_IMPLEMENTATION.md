# Trovestak UI/UX Transformation
## Technical Implementation Guide

**Version:** 1.0  
**Date:** February 2026  
**Related Document:** UI_TRANSFORMATION_SCOPE.md

---

## Phase 1: Visual Foundation

### 1.1 Navbar Glass Effect Refinement

**File:** `src/components/navbar.tsx`  
**Lines:** ~686-689  
**Change:** Refine transparency and blur

```tsx
// BEFORE:
style={{
  backgroundColor: "rgba(29, 29, 31, 0.92)",
  backdropFilter: "saturate(180%) blur(20px)",
}

// AFTER (Light Mode):
style={{
  backgroundColor: isScrolled ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0)",
  backdropFilter: "blur(20px) saturate(180%)",
}}

// AFTER (Dark Mode):
className="dark:bg-black/80 dark:backdrop-blur-xl"
```

### 1.2 Hero Section Transformation

**File:** Create `src/components/hero-section.tsx`  
**Replace:** `src/components/hero-carousel.tsx`

```tsx
// NEW COMPONENT: src/components/hero-section.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface HeroProps {
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  learnMoreHref?: string;
  imageUrl: string;
  imageAlt: string;
}

export function HeroSection({ hero }: { hero: HeroProps }) {
  const appleEase = [0.16, 1, 0.3, 1];

  return (
    <section className="relative h-[70vh] md:h-[80vh] overflow-hidden bg-[#f5f5f7] dark:bg-[#1d1d1f]">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={hero.imageUrl}
          alt={hero.imageAlt}
          fill
          className="object-cover md:object-contain md:object-center"
          priority
        />
      </div>

      {/* Content */}
      <div className="absolute bottom-20 left-8 md:left-20 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: appleEase }}
        >
          <span className="text-sm font-medium text-[#1d1d1f] dark:text-white">
            {hero.subtitle}
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-[#1d1d1f] dark:text-white mt-2 tracking-tight">
            {hero.title}
          </h1>
          <p className="text-lg text-[#86868b] mt-2">
            {hero.description}
          </p>
          <div className="flex gap-4 mt-6">
            <Link
              href={hero.ctaHref}
              className="px-6 py-2.5 bg-[#0071e3] text-white rounded-full font-medium text-sm hover:bg-[#0077ed] transition-colors"
            >
              {hero.ctaText}
            </Link>
            {hero.learnMoreHref && (
              <Link
                href={hero.learnMoreHref}
                className="px-6 py-2.5 text-[#0071e3] font-medium text-sm hover:underline"
              >
                Learn more →
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

### 1.3 Bento Grid Expansion

**File:** `src/components/bento-card.tsx`  
**Change:** Add size variants

```tsx
// ADD: Size variant interface and classes
interface BentoCardProps {
  // ... existing props
  size?: "large" | "medium" | "small" | "wide" | "tall";
}

const sizeClasses = {
  large: "col-span-2 row-span-2",
  medium: "col-span-1 row-span-2", 
  wide: "col-span-2 row-span-1",
  small: "col-span-1 row-span-1",
  tall: "col-span-1 row-span-2",
};

// UPDATE: BentoGrid component
export function BentoGrid() {
  const categories = [
    { title: "Mobile Phones", size: "large" as const, ... },
    { title: "Computing", size: "medium" as const, ... },
    { title: "Audio", size: "small" as const, ... },
    { title: "Gaming", size: "wide" as const, ... },
  ];

  return (
    <div className="grid grid-cols-4 auto-rows-[280px] gap-4">
      {categories.map((cat) => (
        <BentoCard key={cat.href} {...cat} size={cat.size} />
      ))}
    </div>
  );
}

// UPDATE: Remove gradient backgrounds
const gradients = {
  mobile: "bg-[#f5f5f7] dark:bg-[#2d2d2f]",
  // Remove gradient classes, use solid colors
};
```

### 1.4 Product Card Simplification

**File:** `src/components/product-card.tsx`  
**Change:** Clean styling

```tsx
// UPDATE: Clean background
<div className="bg-white dark:bg-[#1d1d1f] rounded-2xl border border-[#e5e5e5] dark:border-[#424245] p-4">

// UPDATE: Simplified badge
{product.is_new && (
  <span className="text-[10px] font-medium text-[#86868b]">
    New
  </span>
)}

// UPDATE: Add financing display
<div className="flex items-baseline gap-2">
  <span className="text-lg font-semibold">
    {formatPrice(price)}
  </span>
  {price > 0 && (
    <span className="text-xs text-[#86868b]">
      from {formatPrice(Math.ceil(price / 6))}/mo.
    </span>
  )}
</div>

// UPDATE: Simplify hover
<div className="transition-transform duration-300 hover:-translate-y-1">
```

---

## Phase 2: Discovery Flow

### 2.1 Chapter Navigation

**File:** Create `src/components/chapter-nav.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ChapterItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface ChapterNavProps {
  items: ChapterItem[];
  category: string;
}

export function ChapterNav({ items, category }: ChapterNavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={cn(
      "sticky top-[44px] z-40 border-b transition-all duration-300",
      scrolled 
        ? "bg-white/80 dark:bg-black/80 backdrop-blur-xl border-[#e5e5e5] dark:border-[#424245]"
        : "bg-transparent border-transparent"
    )}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                "text-[#1d1d1f] dark:text-white",
                "hover:bg-[#f5f5f7] dark:hover:bg-[#2d2d2f]",
                item.href === `/category/${category}`
                  ? "bg-[#f5f5f7] dark:bg-[#2d2d2f]"
                  : ""
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
```

### 2.2 Why Buy Section

**File:** Create `src/components/why-buy-section.tsx`

```tsx
"use client";

import { Truck, Shield, CreditCard, RotateCcw } from "lucide-react";

const benefits = [
  { icon: Truck, title: "Free Delivery", desc: "Same-day in Nairobi, next-day across Kenya" },
  { icon: Shield, title: "Official Warranty", desc: "100% genuine products with manufacturer support" },
  { icon: CreditCard, title: "Easy Payments", desc: "M-Pesa & BNPL options available" },
  { icon: RotateCcw, title: "14-Day Returns", desc: "Hassle-free return policy" },
];

export function WhyBuySection() {
  return (
    <section className="py-16 bg-[#f5f5f7] dark:bg-[#1d1d1f]">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-12">
          Why Trovestak is the best place to buy
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="text-center">
              <div className="inline-flex p-4 rounded-full bg-white dark:bg-[#2d2d2f] mb-4">
                <benefit.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold">{benefit.title}</h3>
              <p className="text-sm text-[#86868b] mt-1">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### 2.3 Feature Tabs

**File:** Create `src/components/feature-tabs.tsx`

```tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  content: {
    title: string;
    description: string;
    image?: string;
  };
}

interface FeatureTabsProps {
  categoryName: string;
  tabs: Tab[];
}

export function FeatureTabs({ categoryName, tabs }: FeatureTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id);

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8">Get to know {categoryName}</h2>
        
        {/* Tab buttons */}
        <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-[#1d1d1f] text-white dark:bg-white dark:text-black"
                  : "bg-[#f5f5f7] text-[#86868b]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Tab content */}
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              "grid md:grid-cols-2 gap-8 items-center",
              activeTab === tab.id ? "block" : "hidden"
            )}
          >
            {tab.content.image && (
              <div className="aspect-video bg-[#f5f5f7] rounded-2xl overflow-hidden">
                <img src={tab.content.image} alt={tab.content.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold mb-4">{tab.content.title}</h3>
              <p className="text-[#86868b]">{tab.content.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

---

## Phase 3: Selection Flow

### 3.1 Image Gallery

**File:** `src/app/products/[slug]/ProductPageClient.tsx`  
**Add:** Thumbnail gallery component

```tsx
// ADD: ProductGallery component
function ProductGallery({ images, productName }: { images: string[]; productName: string }) {
  const [selected, setSelected] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-[#f5f5f7] rounded-2xl flex items-center justify-center">
        <span className="text-6xl">📱</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="aspect-square bg-[#f5f5f7] rounded-2xl overflow-hidden">
        <img 
          src={images[selected]} 
          alt={`${productName} - Image ${selected + 1}`} 
          className="w-full h-full object-contain" 
        />
      </div>
      
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={cn(
                "w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors flex-shrink-0",
                selected === i ? "border-[#0071e3]" : "border-transparent hover:border-[#d2d2d7]"
              )}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 3.2 Dual CTAs

**File:** `src/app/products/[slug]/ProductPageClient.tsx`  
**Replace:** Single "Add to Bag" button

```tsx
// REPLACE: CTA section
<div className="flex gap-3 mt-6">
  <a
    href="#overview"
    className="flex-1 py-3 px-6 rounded-full border border-[#d2d2d7] font-medium text-[#1d1d1f] text-center hover:bg-[#f5f5f7] transition-colors"
  >
    Learn more
  </a>
  <button 
    onClick={handleAddToCart}
    className="flex-1 py-3 px-6 rounded-full bg-[#0071e3] text-white font-medium hover:bg-[#0077ed] transition-colors"
  >
    Buy
  </button>
</div>
```

### 3.3 Comparison Table

**File:** Create `src/components/comparison-table.tsx`

```tsx
"use client";

import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  thumbnail: string;
  specs: Record<string, string>;
}

interface ComparisonTableProps {
  products: Product[];
  specLabels: Record<string, string>;
}

export function ComparisonTable({ products, specLabels }: ComparisonTableProps) {
  const specKeys = Object.keys(specLabels);

  return (
    <section className="py-16">
      <h2 className="text-2xl font-bold text-center mb-8">
        Which is right for you?
      </h2>
      
      <div className="overflow-x-auto">
        <table className="w-full max-w-4xl mx-auto">
          <thead>
            <tr className="border-b border-[#d2d2d7]">
              <th className="text-left py-4 px-4"></th>
              {products.map((p) => (
                <th key={p.id} className="text-left py-4 px-4 min-w-[150px]">
                  <img src={p.thumbnail} alt={p.name} className="w-24 mx-auto mb-2" />
                  <p className="font-semibold text-sm">{p.name}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {specKeys.map((key) => (
              <tr key={key} className="border-b border-[#f5f5f7]">
                <td className="py-3 px-4 font-medium text-sm text-[#86868b]">
                  {specLabels[key]}
                </td>
                {products.map((p) => (
                  <td key={p.id} className="py-3 px-4 text-center text-sm">
                    {p.specs[key] || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

---

## Phase 4: Polish

### 4.1 Animation Constants

**File:** Create `src/lib/animation-constants.ts`

```tsx
// Apple-standard animation values
export const appleEase = [0.16, 1, 0.3, 1] as const;

export const transitionDefaults = {
  duration: 0.4,
  ease: appleEase,
} as const;

export const staggerChildren = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
     : 0. delayChildren1,
    },
  },
} as const;

export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: transitionDefaults,
  },
} as const;
```

### 4.2 Design Tokens

**File:** `tailwind.config.ts`  
**Add:** Apple-inspired colors

```ts
// ADD to theme.extend.colors
colors: {
  apple: {
    blue: "#0071e3",
    "blue-hover": "#0077ed",
    gray: "#f5f5f7",
    "gray-dark": "#1d1d1f",
    border: "#d2d2d7",
    "text-primary": "#1d1d1f",
    "text-secondary": "#86868b",
  },
},
```

### 4.3 Global CSS

**File:** `src/app/globals.css`  
**Add:**

```css
@layer utilities {
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}

@layer base {
  h1 {
    @apply text-4xl md:text-5xl font-bold tracking-tight;
  }
  h2 {
    @apply text-3xl md:text-4xl font-bold tracking-tight;
  }
  h3 {
    @apply text-xl md:text-2xl font-semibold;
  }
}
```

---

## Testing Checklist

### Phase 1 Verification
- [ ] Navbar glass effect works on scroll
- [ ] Hero displays correctly on mobile/desktop
- [ ] Bento grid shows varied sizes
- [ ] Product cards have clean backgrounds

### Phase 2 Verification
- [ ] Chapter nav sticks on scroll
- [ ] Category page shows 2-col paired layout
- [ ] Why Buy section displays 4 benefits
- [ ] Feature tabs expand/collapse

### Phase 3 Verification
- [ ] Image gallery shows thumbnails
- [ ] Dual CTAs visible on PDP
- [ ] Comparison table renders correctly
- [ ] Financing pricing displays

### Phase 4 Verification
- [ ] All animations run smoothly at 60fps
- [ ] Typography consistent across pages
- [ ] Spacing consistent across sections
- [ ] Mobile responsive on all breakpoints

---

## Rollback Plan

If issues arise:

1. **Revert to previous component:** Use git to restore original files
2. **Disable new features:** Feature flags for chapter nav, comparison table
3. **Fallback to carousel:** Keep hero-carousel.tsx as backup

---

## Related Documents

- [UI_TRANSFORMATION_SCOPE.md](./UI_TRANSFORMATION_SCOPE.md) - Project scope and overview
- [CHANGELOG.md](./CHANGELOG.md) - Version history

---

**Document Version:** 1.0  
**Last Updated:** February 2026
