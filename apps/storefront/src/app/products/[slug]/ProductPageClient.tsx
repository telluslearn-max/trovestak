'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/stores/cart'
import { useCompareStore } from '@/stores/compare'
import { formatKES } from '@/lib/formatters'
import { useConciergeTracker } from '@/hooks/useConciergeTracker'
import { submitReviewAction, markReviewHelpfulAction } from './actions'
import { ReviewSummary } from '@/components/reviews/ReviewSummary'
import { ReviewList } from '@/components/reviews/ReviewList'
import { ReviewForm } from '@/components/reviews/ReviewForm'
import { ShoppingBag, Smartphone, CreditCard, Truck, Shield, Package, Rocket, Diamond, GitCompare } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────
interface FeatureCard { icon: string; title: string; desc: string }
interface SpecGroup { [key: string]: string }
interface QAItem { q: string; a: string }
interface Color { name: string; hex1: string; hex2: string }
interface TradeInDevice { name: string; value: number }
interface TradeInGroup { group: string; items: TradeInDevice[] }
interface Addons {
    bnpl?: boolean
    bnpl_min_price?: number
    trade_in?: boolean
    same_day_available?: boolean
    insurance?: boolean
}

interface Product {
    id: string
    name: string
    slug: string
    description: string | null
    thumbnail_url: string | null
    sku: string | null
    nav_category: string | null
    nav_subcategory: string | null
    brand_type: string | null
    content_overview: string | null
    content_features: FeatureCard[]
    content_specifications: Record<string, SpecGroup>
    content_qa: QAItem[]
    metadata: {
        badge?: string
        compare_price?: number
        warranty?: string
        model?: string
        availability?: 'in_stock' | 'limited' | 'pre_order' | 'out_of_stock'
        breadcrumb?: string[]
        colors?: Color[]
        addons?: Addons
        trade_in_devices?: TradeInGroup[]
        svg?: { type: string; colorIds?: string[] }
        average_rating?: number
        review_count?: number
    }
    average_rating?: number
    review_count?: number
}

interface Variant {
    id: string
    name: string
    price_kes: number
    stock_quantity: number
    sku: string | null
    options: {
        storage?: string
        desc?: string
        color?: string
        is_default?: boolean
        hex1?: string
        hex2?: string
    }
}

interface Pricing {
    cost_price?: number
    sell_price?: number
    discount_percent?: number
    compare_price?: number | null
    currency?: string
}

interface Content {
    overview?: string | null
    features?: FeatureCard[]
    faq?: QAItem[]
    gallery?: { url: string }[]
    highlights?: { key: string; value: string }[]
}

interface Addon {
    id?: string
    product_id?: string
    addon_type?: string
    is_enabled?: boolean
    config?: Record<string, unknown>
}

interface Props {
    product: Product;
    variants: Variant[]
    pricing?: Pricing | null
    specs?: Record<string, unknown> | null
    content?: Content | null
    addons?: Addon[]
    initialReviews: any[]
    initialRelated: RelatedProduct[]
}

interface RelatedProduct {
    id: string
    name: string
    slug: string
    thumbnail_url: string | null
    brand_type: string | null
    product_variants: { price_kes: number }[]
}

function stockLabel(qty: number): { label: string; cls: string } {
    if (qty === 0) return { label: 'Out of Stock', cls: 'text-red-500' }
    if (qty <= 3) return { label: `Only ${qty} left`, cls: 'text-amber-500' }
    return { label: 'In Stock', cls: 'text-emerald-500' }
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ProductPageClient({ product, variants, pricing, specs: dbSpecs, content: dbContent, addons: dbAddons, initialReviews, initialRelated }: Props) {
    const meta = typeof product.metadata === 'string' ? JSON.parse(product.metadata || '{}') : (product.metadata ?? {})
    const colors = meta.colors ?? []

    // Behavioral Tracking
    useConciergeTracker({
        productId: product.id,
        categoryId: product.nav_category || undefined
    })

    // Get addons from product_addons table (database) - takes priority over metadata
    const dbAddonsMap = (dbAddons || []).reduce((acc: Record<string, boolean>, addon: any) => {
        if (addon.addon_type === 'bnpl') acc.bnpl = addon.is_enabled;
        if (addon.addon_type === 'trade_in') acc.trade_in = addon.is_enabled;
        if (addon.addon_type === 'shipping') acc.shipping = addon.is_enabled;
        if (addon.addon_type === 'insurance') acc.insurance = addon.is_enabled;
        if (addon.addon_type === 'same_day_available' && addon.is_enabled) acc.same_day_available = true;
        return acc;
    }, {} as Record<string, boolean>);

    // Use dbAddons if available, otherwise fall back to metadata
    const metaAddons = Object.keys(dbAddonsMap).length > 0 ? dbAddonsMap : (meta.addons ?? {})
    const tradeIns = meta.trade_in_devices ?? []
    const features = typeof product.content_features === 'string' ? JSON.parse(product.content_features || '[]') : (product.content_features ?? [])
    const specs = typeof product.content_specifications === 'string' ? JSON.parse(product.content_specifications || '{}') : (dbSpecs ?? product.content_specifications ?? {})
    const qa = typeof product.content_qa === 'string' ? JSON.parse(product.content_qa || '[]') : (dbContent?.faq ?? product.content_qa ?? [])
    const contentHighlights = typeof dbContent?.highlights === 'string' ? JSON.parse(dbContent.highlights || '[]') : (dbContent?.highlights ?? [])

    const defaultVariant = variants.find(v => v.options?.is_default) ?? variants[0]
    const [activeVariant, setActiveVariant] = useState<Variant | null>(defaultVariant ?? null)
    const [activeColor, setActiveColor] = useState<Color | null>(colors[0] ?? null)

    const [tradeInBase, setTradeInBase] = useState(0)
    const [tradeInMult, setTradeInMult] = useState<number | null>(null)
    const tradeInCredit = tradeInBase > 0 && tradeInMult !== null ? Math.round(tradeInBase * tradeInMult) : 0

    const [bnplMonths, setBnplMonths] = useState(6)
    const [openAddon, setOpenAddon] = useState<string | null>('bnpl')
    const [openFaq, setOpenFaq] = useState<number | null>(null)
    const [proModal, setProModal] = useState(false)
    const [addedToCart, setAddedToCart] = useState(false)
    const [savedToWishlist, setSaved] = useState(false)

    // Use pricing from new product_pricing table if available, otherwise fallback to variant price
    const pricingData = pricing && pricing.sell_price > 0 ? pricing : null
    const basePrice = pricingData ? pricingData.sell_price : (activeVariant ? Math.round(activeVariant.price_kes / 100) : 0)

    // Compare state
    const { addProduct, removeProduct, isInCompare, canAddMore } = useCompareStore()
    const inCompare = product.id ? isInCompare(product.id) : false

    const handleCompare = useCallback(() => {
        if (!product.id) return
        const currentPrice = pricingData ? pricingData.sell_price : (activeVariant ? Math.round(activeVariant.price_kes / 100) : 0)
        if (inCompare) {
            removeProduct(product.id)
        } else if (canAddMore()) {
            addProduct({
                id: product.id,
                name: product.name,
                slug: product.slug || '',
                thumbnail_url: product.thumbnail_url,
                brand_type: product.brand_type,
                price: currentPrice,
                specs: specs || {},
                highlights: []
            })
        }
    }, [product, activeVariant, pricingData, specs, inCompare, canAddMore, addProduct, removeProduct])

    // Reviews state
    const [reviews, setReviews] = useState<any[]>(initialReviews)
    const [reviewCount, setReviewCount] = useState(initialReviews.length)
    const [averageRating, setAverageRating] = useState(0)
    const [ratingDistribution, setRatingDistribution] = useState<Record<number, number>>({})
    const [reviewsLoading, setReviewsLoading] = useState(false)
    const [reviewFormOpen, setReviewFormOpen] = useState(false)

    // Related products state
    const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>(initialRelated)
    const [relatedLoading, setRelatedLoading] = useState(false)

    const comparePrice = pricingData?.compare_price ?? meta.compare_price
    const discountPercent = pricingData?.discount_percent ?? 0
    const totalStock = variants.reduce((s, v) => s + (v.stock_quantity ?? 0), 0)
    const { label: stockLbl, cls: stockCls } = stockLabel(activeVariant?.stock_quantity ?? totalStock)

    const bnplFee = bnplMonths === 3 ? 1.0 : bnplMonths === 6 ? 1.03 : 1.06
    const bnplAmt = basePrice > 0 ? Math.ceil(basePrice * bnplFee / bnplMonths) : 0
    const effectivePrice = Math.max(0, basePrice - tradeInCredit)

    const breadcrumb: string[] = meta.breadcrumb ?? [
        'Home',
        product.nav_category ?? 'Phones',
        product.brand_type ?? 'Brand',
    ]

    const handleAddToCart = useCallback(() => {
        if (!activeVariant) return

        const { addItem } = useCartStore.getState()
        addItem({
            id: `${product.id}-${activeVariant.id}`,
            product_id: product.id,
            variant_id: activeVariant.id,
            title: `${product.name}${activeVariant.options?.storage ? ` — ${activeVariant.options.storage}` : ''}${activeColor ? ` (${activeColor.name})` : ''}`,
            quantity: 1,
            unit_price: basePrice,
            thumbnail: product.thumbnail_url || undefined,
        })

        setAddedToCart(true)
        setTimeout(() => setAddedToCart(false), 2500)
    }, [activeVariant, product.id, product.name, product.thumbnail_url, basePrice, activeColor])

    // Calculate distribution once
    useEffect(() => {
        if (reviews.length > 0) {
            const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            reviews.forEach((r: { rating: number }) => { dist[r.rating] = (dist[r.rating] || 0) + 1 })
            setRatingDistribution(dist)
        }

        setAverageRating(product.metadata?.average_rating || 0)
        setReviewCount(product.metadata?.review_count || 0)
    }, [reviews, product.metadata])

    // Related products handled via initialRelated

    const handleReviewSubmit = async (review: { rating: number; title: string; body: string; pros: string[]; cons: string[] }) => {
        const result = await submitReviewAction(product.id, review);
        if (result.error) throw new Error(result.error);
    }

    const handleHelpful = async (reviewId: string) => {
        await markReviewHelpfulAction(reviewId);
    }

    const handleWishlist = useCallback(() => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
    }, [])

    // Thumbnail fallback
    const heroImage = product.thumbnail_url

    return (
        <>
            <style>{`
        :root {
          --accent: #c8975a;
          --accent2: #e4b97a;
          --bg: #0e0e0f;
          --surface: #161618;
          --surface2: #1c1c1e;
          --border: rgba(255,255,255,0.07);
          --text: #f5f3ef;
          --sub: rgba(245,243,239,0.55);
          --green: #34c759;
          --red: #ff3b30;
        }
        .pdp-root { background:var(--bg); color:var(--text); font-family:'Inter',system-ui,sans-serif; min-height:100vh; }
        .pdp-nav { position:sticky;top:0;z-index:50;background:rgba(14,14,15,0.85);backdrop-filter:blur(24px);
          border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;
          padding:0 clamp(1rem,5vw,4rem);height:64px; }
        .pdp-nav-logo { font-weight:900;font-size:1.1rem;letter-spacing:-0.03em;color:var(--accent); }
        .pdp-nav-breadcrumb { display:flex;align-items:center;gap:8px;font-size:11px;font-weight:700;
          text-transform:uppercase;letter-spacing:0.1em;color:var(--sub); }
        .pdp-nav-breadcrumb span { cursor:pointer; }
        .pdp-nav-breadcrumb span:hover { color:var(--accent); }
        .pdp-layout { display:grid;grid-template-columns:1fr 1fr;gap:3rem;
          max-width:1280px;margin:0 auto;padding:3rem clamp(1rem,5vw,3rem);align-items:start; }
        @media(max-width:900px){.pdp-layout{grid-template-columns:1fr;}.pdp-gallery{position:static!important;}}
        .pdp-gallery { position:sticky;top:80px; }
        .gallery-main { background:var(--surface);border-radius:2rem;aspect-ratio:1;display:flex;
          align-items:center;justify-content:center;position:relative;overflow:hidden;border:1px solid var(--border); }
        .gallery-img { width:80%;height:80%;object-fit:contain; }
        .gallery-placeholder { display:flex;flex-direction:column;align-items:center;justify-content:center;
          gap:1rem;color:var(--sub);font-size:5rem; }
        .gallery-badge { position:absolute;top:1.5rem;left:1.5rem;background:var(--accent);color:#000;
          font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.12em;
          padding:5px 12px;border-radius:50px; }
        .gallery-stock { position:absolute;top:1.5rem;right:1.5rem;background:rgba(0,0,0,0.6);
          backdrop-filter:blur(8px);border:1px solid var(--border);font-size:10px;font-weight:700;
          text-transform:uppercase;letter-spacing:0.08em;padding:5px 12px;border-radius:50px; }
        .breadcrumb-row { display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;
          text-transform:uppercase;letter-spacing:0.1em;color:var(--sub);margin-bottom:1rem; }
        .product-category { font-size:11px;font-weight:700;text-transform:uppercase;
          letter-spacing:0.15em;color:var(--accent);margin-bottom:0.5rem; }
        .product-title { font-size:clamp(1.8rem,4vw,2.8rem);font-weight:900;letter-spacing:-0.03em;
          line-height:1.05;margin-bottom:0.5rem; }
        .product-subtitle { color:var(--sub);font-size:0.9rem;font-weight:500;margin-bottom:1.5rem; }
        .price-row { display:flex;align-items:baseline;gap:1rem;margin-bottom:0.5rem; }
        .price-main { font-size:2.2rem;font-weight:900;letter-spacing:-0.03em;color:var(--accent); }
        .price-orig { font-size:1rem;font-weight:600;color:var(--sub);text-decoration:line-through; }
        .price-bnpl { font-size:12px;font-weight:700;color:var(--sub);cursor:pointer; }
        .price-bnpl:hover { color:var(--accent); }
        .stock-badge { display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;
          text-transform:uppercase;letter-spacing:0.1em;margin-bottom:1.5rem; }
        .config-label { font-size:10px;font-weight:900;text-transform:uppercase;
          letter-spacing:0.12em;color:var(--sub);margin-bottom:10px; }
        .swatches { display:flex;gap:10px;flex-wrap:wrap;margin-bottom:1.5rem; }
        .swatch { width:36px;height:36px;border-radius:50%;cursor:pointer;border:2px solid transparent;
          transition:all 0.2s;display:flex;align-items:center;justify-content:center; }
        .swatch.active { border-color:var(--accent);box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--accent); }
        .swatch-tooltip { position:relative; }
        .tier-cards { display:flex;flex-direction:column;gap:10px;margin-bottom:1.5rem; }
        .tier-card { background:var(--surface);border:1px solid var(--border);border-radius:1rem;
          padding:1rem 1.25rem;cursor:pointer;display:flex;justify-content:space-between;
          align-items:center;transition:all 0.2s; }
        .tier-card:hover { border-color:var(--accent); }
        .tier-card.active { border-color:var(--accent);background:rgba(200,151,90,0.08); }
        .tier-card-left {}
        .tier-name { font-weight:800;font-size:0.9rem; }
        .tier-desc { font-size:11px;color:var(--sub);font-weight:600; }
        .tier-price { font-weight:900;font-size:1rem;color:var(--accent); }
        .tier-stock { font-size:10px;color:var(--sub);font-weight:600; }
        .addon-card { background:var(--surface);border:1px solid var(--border);border-radius:1.5rem;
          overflow:hidden;transition:all 0.2s;margin-bottom:10px; }
        .addon-header { display:flex;align-items:center;gap:12px;padding:1rem 1.25rem;cursor:pointer; }
        .addon-header:hover { background:rgba(255,255,255,0.02); }
        .addon-icon { font-size:1.4rem; }
        .addon-meta { flex:1; }
        .addon-title { font-weight:800;font-size:0.9rem;display:flex;align-items:center;gap:8px; }
        .addon-subtitle { font-size:11px;color:var(--sub);font-weight:600;margin-top:2px; }
        .addon-toggle { font-size:1.2rem;color:var(--sub);transition:transform 0.3s; }
        .addon-card.open .addon-toggle { transform:rotate(180deg); }
        .addon-body { display:none;padding:0 1.25rem 1.25rem; }
        .addon-card.open .addon-body { display:block; }
        .bnpl-plans { display:flex;flex-direction:column;gap:8px; }
        .bnpl-plan { background:var(--surface2);border:1px solid var(--border);border-radius:1rem;
          padding:0.9rem 1rem;cursor:pointer;display:flex;justify-content:space-between;
          align-items:center;transition:all 0.2s; }
        .bnpl-plan.active { border-color:var(--accent); }
        .bnpl-plan-label { font-weight:700;font-size:0.85rem; }
        .bnpl-plan-note { font-size:10px;color:var(--sub);font-weight:600;margin-top:2px; }
        .bnpl-plan-amount { font-weight:900;font-size:0.95rem;color:var(--accent); }
        .bnpl-note { font-size:10px;color:var(--sub);font-weight:600;margin-top:10px;line-height:1.6; }
        .fbadge { font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;
          padding:2px 6px;border-radius:4px;margin-left:6px; }
        .fbadge.f0 { background:rgba(52,199,89,0.15);color:#34c759; }
        .fbadge.f3 { background:rgba(255,149,0,0.15);color:#ff9500; }
        .fbadge.f6 { background:rgba(255,59,48,0.15);color:#ff3b30; }
        .tradein-select { width:100%;background:var(--surface2);border:1px solid var(--border);
          border-radius:0.75rem;padding:10px 14px;color:var(--text);font-size:0.85rem;font-weight:600; }
        .cond-opts { display:flex;flex-direction:column;gap:8px;margin-top:12px; }
        .cond-opt { background:var(--surface2);border:1px solid var(--border);border-radius:0.75rem;
          padding:0.8rem 1rem;cursor:pointer;display:flex;justify-content:space-between;
          align-items:center;transition:all 0.2s; }
        .cond-opt.active { border-color:var(--accent); }
        .cond-label { font-weight:700;font-size:0.85rem; }
        .cond-desc { font-size:10px;color:var(--sub);font-weight:600;margin-top:2px; }
        .cond-val { font-weight:900;font-size:0.9rem;color:var(--accent); }
        .ti-summary { background:rgba(52,199,89,0.08);border:1px solid rgba(52,199,89,0.2);
          border-radius:0.75rem;padding:0.8rem 1rem;margin-top:10px; }
        .ti-credit { font-size:1.3rem;font-weight:900;color:#34c759; }
        .ti-total { font-size:11px;color:var(--sub);font-weight:600; }
        .ship-opts { display:flex;flex-direction:column;gap:8px; }
        .ship-opt { background:var(--surface2);border:1px solid var(--border);border-radius:1rem;
          padding:0.9rem 1rem;cursor:pointer;transition:all 0.2s; }
        .ship-opt.active { border-color:var(--accent); }
        .ship-opt.pro-locked { opacity:0.7;cursor:default; }
        .ship-name { font-weight:800;font-size:0.85rem;margin-bottom:2px; }
        .ship-desc { font-size:11px;color:var(--sub);font-weight:600; }
        .ship-price { font-size:11px;color:var(--accent);font-weight:700;margin-top:4px; }
        .unlock-btn { margin-top:8px;background:var(--accent);color:#000;border:none;border-radius:0.5rem;
          padding:6px 14px;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;
          cursor:pointer;transition:all 0.2s; }
        .unlock-btn:hover { opacity:0.85; }
        .pro-badge { background:rgba(200,151,90,0.15);color:var(--accent);font-size:8px;font-weight:900;
          text-transform:uppercase;letter-spacing:0.1em;padding:2px 8px;border-radius:4px;border:1px solid rgba(200,151,90,0.3); }
        .ins-title { font-weight:800;font-size:0.9rem;margin-bottom:6px; }
        .ins-desc { font-size:11px;color:var(--sub);font-weight:600;line-height:1.6;margin-bottom:12px; }
        .ins-feats { display:flex;flex-direction:column;gap:6px; }
        .ins-feat { display:flex;justify-content:space-between;align-items:center;font-size:12px;
          font-weight:600;padding:8px 10px;background:var(--surface);border-radius:0.5rem; }
        .notify-btn { width:100%;margin-top:12px;background:transparent;border:1px solid var(--accent);
          color:var(--accent);border-radius:0.75rem;padding:10px;font-size:11px;font-weight:900;
          text-transform:uppercase;letter-spacing:0.1em;cursor:pointer;transition:all 0.2s; }
        .notify-btn:hover { background:var(--accent);color:#000; }
        .cta-block { display:flex;flex-direction:column;gap:10px;margin-top:1rem; }
        .btn-primary { background:var(--accent);color:#000;border:none;border-radius:1rem;
          padding:1rem 1.5rem;font-weight:900;font-size:0.9rem;text-transform:uppercase;
          letter-spacing:0.1em;cursor:pointer;transition:all 0.2s;width:100%; }
        .btn-primary:hover { opacity:0.9;transform:translateY(-1px); }
        .btn-primary:active { transform:translateY(0); }
        .btn-primary.done { background:var(--green); }
        .btn-secondary { background:transparent;color:var(--text);border:1px solid var(--border);
          border-radius:1rem;padding:1rem 1.5rem;font-weight:700;font-size:0.85rem;cursor:pointer;
          transition:all 0.2s;width:100%; }
        .btn-secondary:hover { border-color:var(--accent);color:var(--accent); }
        .btn-secondary.done { border-color:var(--green);color:var(--green); }
        .cta-perks { display:flex;gap:1rem;font-size:11px;font-weight:700;color:var(--sub);
          flex-wrap:wrap;padding-top:4px; }
        .cta-perk { display:flex;align-items:center;gap:4px; }
        .cta-perk-icon { color:var(--green); }
        .content-sec { padding:3rem clamp(1rem,5vw,3rem);max-width:1280px;margin:0 auto; }
        .section-tag { font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;
          color:var(--accent);display:block;margin-bottom:0.75rem; }
        .section-heading { font-size:clamp(1.8rem,4vw,2.8rem);font-weight:900;letter-spacing:-0.03em;
          margin-bottom:0.5rem; }
        .section-sub { color:var(--sub);font-size:0.9rem;font-weight:500;margin-bottom:2rem; }
        .features-grid { display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem; }
        .feat-card { background:var(--surface);border:1px solid var(--border);border-radius:1.5rem;padding:2rem; }
        .feat-icon { font-size:2.2rem;margin-bottom:1rem; }
        .feat-title { font-size:1rem;font-weight:800;margin-bottom:0.5rem; }
        .feat-desc { font-size:0.85rem;color:var(--sub);font-weight:500;line-height:1.7; }
        .specs-grid { display:grid;grid-template-columns:1fr 1fr;gap:3rem; }
        @media(max-width:700px){.specs-grid{grid-template-columns:1fr;}}
        .spec-group-title { font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;
          color:var(--accent);margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border); }
        .spec-row { display:flex;justify-content:space-between;gap:1rem;padding:7px 0;
          border-bottom:1px solid rgba(255,255,255,0.03);font-size:13px; }
        .spec-key { color:var(--sub);font-weight:600; }
        .spec-val { font-weight:700;text-align:right; }
        .faq-item { border-bottom:1px solid var(--border); }
        .faq-q { display:flex;justify-content:space-between;align-items:center;padding:1.2rem 0;
          cursor:pointer;font-weight:700;font-size:0.95rem;gap:1rem; }
        .faq-q:hover { color:var(--accent); }
        .faq-icon { font-size:1.2rem;flex-shrink:0;transition:transform 0.3s; }
        .faq-item.open .faq-icon { transform:rotate(45deg);color:var(--accent); }
        .faq-a { display:none;padding-bottom:1.2rem;color:var(--sub);font-size:0.9rem;
          font-weight:500;line-height:1.8; }
        .faq-item.open .faq-a { display:block; }
        .mobile-bar { display:none;position:fixed;bottom:0;left:0;right:0;z-index:100;
          background:rgba(14,14,15,0.95);backdrop-filter:blur(20px);border-top:1px solid var(--border);
          padding:1rem clamp(1rem,5vw,2rem);flex-direction:row;align-items:center;
          justify-content:space-between;gap:1rem; }
        @media(max-width:900px){.mobile-bar{display:flex;}.pdp-root{padding-bottom:80px;}}
        .mb-price { font-size:1.3rem;font-weight:900;color:var(--accent); }
        .mb-cfg { font-size:11px;color:var(--sub);font-weight:600; }
        .mb-btn { background:var(--accent);color:#000;border:none;border-radius:0.75rem;
          padding:0.75rem 1.5rem;font-weight:900;font-size:12px;text-transform:uppercase;
          letter-spacing:0.1em;cursor:pointer;white-space:nowrap; }
        .pro-overlay { display:none;position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.7);
          backdrop-filter:blur(10px);align-items:center;justify-content:center; }
        .pro-overlay.visible { display:flex; }
        .pro-modal { background:var(--surface);border:1px solid var(--border);border-radius:2rem;
          padding:2.5rem;max-width:420px;width:90%;text-align:center;position:relative; }
        .pm-close { position:absolute;top:1.5rem;right:1.5rem;background:var(--surface2);
          border:1px solid var(--border);border-radius:50%;width:36px;height:36px;cursor:pointer;
          color:var(--sub);font-size:1rem; }
        .pm-badge { display:inline-flex;margin-bottom:1rem;padding:4px 14px;border-radius:50px;
          background:rgba(200,151,90,0.15);color:var(--accent);font-size:10px;font-weight:900;
          text-transform:uppercase;letter-spacing:0.12em;border:1px solid rgba(200,151,90,0.3); }
        .pm-title { font-size:1.4rem;font-weight:900;margin-bottom:1.5rem; }
        .pm-benefits { display:flex;flex-direction:column;gap:10px;text-align:left;margin-bottom:1.5rem; }
        .pm-benefit { background:var(--surface2);border-radius:0.75rem;padding:10px 14px;
          font-size:13px;font-weight:700; }
        .pm-label { font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;
          color:var(--sub);margin-bottom:8px; }
        .pm-email { width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:0.75rem;
          padding:10px 14px;color:var(--text);font-size:0.9rem;margin-bottom:10px; }
        .pm-note { font-size:11px;color:var(--sub);font-weight:600;margin-top:10px; }
        .divider { border:none;border-top:1px solid var(--border);margin:0; }
        .tag-limited { font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;
          padding:2px 8px;border-radius:4px;background:rgba(255,149,0,0.15);color:#ff9500; }
        .pdp-footer { padding:3rem clamp(1rem,5vw,3rem);max-width:1280px;margin:0 auto;
          color:var(--sub);font-size:12px;font-weight:600;display:flex;gap:2rem;flex-wrap:wrap; }
      `}</style>

            <div className="pdp-root">
                {/* Nav */}
                <nav className="pdp-nav">
                    <span className="pdp-nav-logo">trovestak</span>
                    <div className="pdp-nav-breadcrumb">
                        {breadcrumb.map((crumb, i) => (
                            <span key={i}>
                                {i > 0 && <span style={{ opacity: 0.3, marginRight: 8 }}>›</span>}
                                <span>{crumb}</span>
                            </span>
                        ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <ShoppingBag style={{ width: 14, height: 14 }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Bag
                        </span>
                    </div>
                </nav>

                {/* Layout */}
                <div className="pdp-layout">
                    {/* Gallery */}
                    <div className="pdp-gallery">
                        <div className="gallery-main">
                            {heroImage ? (
                                <img
                                    src={activeColor ? heroImage : heroImage}
                                    alt={product.name}
                                    className="gallery-img"
                                />
                            ) : (
                                <div className="gallery-placeholder">
                                    <Smartphone style={{ width: 48, height: 48, opacity: 0.3 }} />
                                    <span style={{ fontSize: '0.9rem', color: 'var(--sub)', fontWeight: 700 }}>
                                        {product.name}
                                    </span>
                                </div>
                            )}
                            {meta.badge && <div className="gallery-badge">{meta.badge}</div>}
                            <div className={`gallery-stock ${stockCls}`}>{stockLbl}</div>
                        </div>
                    </div>

                    {/* Configurator */}
                    <div>
                        {/* Header */}
                        <div className="product-category">
                            {product.nav_subcategory} · {product.brand_type}
                        </div>
                        <h1 className="product-title">{product.name}</h1>

                        {/* SKU and Model */}
                        {(product.sku || meta.model) && (
                            <div className="product-meta" style={{ marginTop: 8, marginBottom: 12 }}>
                                {product.sku && (
                                    <span style={{ fontSize: '12px', color: 'var(--sub)', fontWeight: 600 }}>
                                        SKU: {product.sku}
                                    </span>
                                )}
                                {product.sku && meta.model && (
                                    <span style={{ color: 'var(--sub)', margin: '0 8px' }}>·</span>
                                )}
                                {meta.model && (
                                    <span style={{ fontSize: '12px', color: 'var(--sub)', fontWeight: 600 }}>
                                        Model: {meta.model}
                                    </span>
                                )}
                            </div>
                        )}

                        {product.description && (
                            <p className="product-subtitle">{product.description}</p>
                        )}

                        {/* Price */}
                        <div className="price-row">
                            <span className="price-main">{fmt(effectivePrice)}</span>
                            {comparePrice && comparePrice > basePrice && (
                                <span className="price-orig">{fmt(comparePrice)}</span>
                            )}
                        </div>
                        {basePrice > 0 && metaAddons.bnpl && (
                            <div
                                className="price-bnpl"
                                onClick={() => setOpenAddon(openAddon === 'bnpl' ? null : 'bnpl')}
                            >
                                From {fmt(bnplAmt)}/mo · BNPL options
                            </div>
                        )}
                        <div className="stock-badge" style={{ marginTop: 10 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                            <span className={stockCls}>{stockLbl}</span>
                            {(activeVariant?.stock_quantity ?? 0) > 0 && (activeVariant?.stock_quantity ?? 0) <= 3 && (
                                <span className="tag-limited">Limited Stock</span>
                            )}
                        </div>

                        {/* Colors */}
                        {colors.length > 0 && (
                            <>
                                <div className="config-label">
                                    Colour — <span style={{ color: 'var(--text)', fontWeight: 700 }}>{activeColor?.name}</span>
                                </div>
                                <div className="swatches">
                                    {colors.map((c: Color, i: number) => (
                                        <div
                                            key={i}
                                            className={`swatch${activeColor?.name === c.name ? ' active' : ''}`}
                                            style={{ background: c.hex1 }}
                                            title={c.name}
                                            onClick={() => setActiveColor(c)}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Variants / Tier cards */}
                        {variants.length > 0 && (
                            <>
                                <div className="config-label">Storage</div>
                                <div className="tier-cards">
                                    {variants.map((v) => {
                                        const price = Math.round(v.price_kes / 100)
                                        return (
                                            <div
                                                key={v.id}
                                                className={`tier-card${activeVariant?.id === v.id ? ' active' : ''}`}
                                                onClick={() => setActiveVariant(v)}
                                            >
                                                <div className="tier-card-left">
                                                    <div className="tier-name">{v.options?.storage ?? v.name}</div>
                                                    <div className="tier-desc">{v.options?.desc ?? v.sku ?? ''}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div className="tier-price">{fmt(price)}</div>
                                                    <div className="tier-stock">
                                                        {v.stock_quantity > 0 ? `${v.stock_quantity} in stock` : 'Out of stock'}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </>
                        )}

                        {/* Addons */}
                        {metaAddons.bnpl && (
                            <div className={`addon-card${openAddon === 'bnpl' ? ' open' : ''}`}>
                                <div className="addon-header" onClick={() => setOpenAddon(openAddon === 'bnpl' ? null : 'bnpl')}>
                                    <div className="addon-icon"><CreditCard /></div>
                                    <div className="addon-meta">
                                        <div className="addon-title">Buy Now, Pay Later</div>
                                        <div className="addon-subtitle">3, 6, or 12-month M-Pesa installments</div>
                                    </div>
                                    <div className="addon-toggle">⌄</div>
                                </div>
                                <div className="addon-body">
                                    <div className="bnpl-plans">
                                        {([3, 6, 12] as const).map(months => {
                                            const fee = months === 3 ? 1.0 : months === 6 ? 1.03 : 1.06
                                            const feeLabel = months === 3 ? '0%' : months === 6 ? '3%' : '6%'
                                            const feeCls = months === 3 ? 'f0' : months === 6 ? 'f3' : 'f6'
                                            const amt = basePrice > 0 ? Math.ceil(basePrice * fee / months) : 0
                                            return (
                                                <div
                                                    key={months}
                                                    className={`bnpl-plan${bnplMonths === months ? ' active' : ''}`}
                                                    onClick={() => setBnplMonths(months)}
                                                >
                                                    <div>
                                                        <div className="bnpl-plan-label">
                                                            {months} months <span className={`fbadge ${feeCls}`}>{feeLabel} fee</span>
                                                        </div>
                                                        <div className="bnpl-plan-note">
                                                            {months === 3 ? 'M-Pesa Fuliza · No interest' : months === 6 ? 'Most popular · Partner banks' : 'Lowest monthly · Equity / KCB / NCBA'}
                                                        </div>
                                                    </div>
                                                    <div className="bnpl-plan-amount">{fmt(amt)}/mo</div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div className="bnpl-note">Available via M-Pesa Fuliza and partner banks. Credit subject to approval. Min order KES 20,000. First instalment at checkout.</div>
                                </div>
                            </div>
                        )}

                        {metaAddons.trade_in && tradeIns.length > 0 && (
                            <div className={`addon-card${openAddon === 'trade' ? ' open' : ''}`}>
                                <div className="addon-header" onClick={() => setOpenAddon(openAddon === 'trade' ? null : 'trade')}>
                                    <div className="addon-icon">♻️</div>
                                    <div className="addon-meta">
                                        <div className="addon-title">Trade In Your Device</div>
                                        <div className="addon-subtitle">Get instant credit toward your purchase</div>
                                    </div>
                                    <div className="addon-toggle">⌄</div>
                                </div>
                                <div className="addon-body">
                                    <select
                                        className="tradein-select"
                                        onChange={e => {
                                            setTradeInBase(parseInt(e.target.value) || 0)
                                            setTradeInMult(null)
                                        }}
                                    >
                                        <option value="">— Choose device to trade in —</option>
                                        {tradeIns.map((group: any) => (
                                            <optgroup key={group.group} label={group.group}>
                                                {group.items.map((item: any) => (
                                                    <option key={item.name} value={item.value}>{item.name}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                    {tradeInBase > 0 && (
                                        <div className="cond-opts">
                                            {([
                                                { label: 'Like New', desc: 'No scratches, original box', mult: 1.0 },
                                                { label: 'Good', desc: 'Minor wear, fully functional', mult: 0.8 },
                                                { label: 'Fair', desc: 'Visible wear, some cosmetic issues', mult: 0.55 },
                                                { label: 'Poor', desc: 'Heavy damage, barely functional', mult: 0.3 },
                                            ]).map(cond => (
                                                <div
                                                    key={cond.label}
                                                    className={`cond-opt${tradeInMult === cond.mult ? ' active' : ''}`}
                                                    onClick={() => setTradeInMult(cond.mult)}
                                                >
                                                    <div>
                                                        <div className="cond-label">{cond.label}</div>
                                                        <div className="cond-desc">{cond.desc}</div>
                                                    </div>
                                                    <div className="cond-val">{fmt(Math.round(tradeInBase * cond.mult))}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {tradeInCredit > 0 && (
                                        <div className="ti-summary">
                                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Trade-in credit applied</div>
                                            <div className="ti-credit">{fmt(tradeInCredit)}</div>
                                            <div className="ti-total">New total: {fmt(effectivePrice)}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Shipping */}
                        <div className={`addon-card${openAddon === 'shipping' ? ' open' : ''}`}>
                            <div className="addon-header" onClick={() => setOpenAddon(openAddon === 'shipping' ? null : 'shipping')}>
                                <div className="addon-icon"><Truck /></div>
                                <div className="addon-meta">
                                    <div className="addon-title">Delivery Options</div>
                                    <div className="addon-subtitle">Nairobi and all 47 counties</div>
                                </div>
                                <div className="addon-toggle">⌄</div>
                            </div>
                            <div className="addon-body">
                                <div className="ship-opts">
                                    <div className="ship-opt active">
                                        <div className="ship-name">Standard Delivery</div>
                                        <div className="ship-desc">2–4 business days · G4S / Wells Fargo courier</div>
                                        <div className="ship-price">KES 300 Nairobi · KES 500–800 Upcountry</div>
                                    </div>
                                    {metaAddons.same_day_available && (
                                        <div className="ship-opt">
                                            <div className="ship-name">Same-Day Delivery</div>
                                            <div className="ship-desc">Order before 12 PM · Nairobi CBD, Westlands, Karen</div>
                                            <div className="ship-price">KES 500 flat</div>
                                        </div>
                                    )}
                                    <div className="ship-opt pro-locked">
                                        <div className="ship-name">Priority Shipping — Free <span className="pro-badge">★ Pro</span></div>
                                        <div className="ship-desc">Same-day guaranteed · White-glove unboxing</div>
                                        <button className="unlock-btn" onClick={() => setProModal(true)}>Unlock with Trovestak Pro</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Insurance */}
                        {metaAddons.insurance && (
                            <div className={`addon-card${openAddon === 'insurance' ? ' open' : ''}`}>
                                <div className="addon-header" onClick={() => setOpenAddon(openAddon === 'insurance' ? null : 'insurance')}>
                                    <div className="addon-icon"><Shield /></div>
                                    <div className="addon-meta">
                                        <div className="addon-title">Device Insurance <span className="pro-badge">★ Coming Soon</span></div>
                                        <div className="addon-subtitle">Accidental damage & theft cover</div>
                                    </div>
                                    <div className="addon-toggle">⌄</div>
                                </div>
                                <div className="addon-body">
                                    <div className="ins-title">Insurance is coming soon.</div>
                                    <div className="ins-desc">Comprehensive device protection tailored for Kenya — from screen cracks to theft on your commute.</div>
                                    <div className="ins-feats">
                                        {['Accidental & liquid damage', 'Theft & loss protection', 'Screen repair (unlimited)', 'Same-day repair Nairobi'].map(f => (
                                            <div key={f} className="ins-feat"><span>✓ {f}</span><span className="pro-badge">★ Pro</span></div>
                                        ))}
                                    </div>
                                    <button className="notify-btn" onClick={() => setProModal(true)}>Notify me when available</button>
                                </div>
                            </div>
                        )}

                        {/* CTA */}
                        <div className="cta-block" style={{ marginTop: 16 }}>
                            <button
                                className={`btn-primary${addedToCart ? ' done' : ''}`}
                                onClick={handleAddToCart}
                                disabled={(activeVariant?.stock_quantity ?? 0) === 0}
                            >
                                {addedToCart ? '✓ Added to Bag' : 'Add to Bag'}
                            </button>
                            <button className={`btn-secondary${savedToWishlist ? ' done' : ''}`} onClick={handleWishlist}>
                                {savedToWishlist ? '✓ Saved to Wishlist' : 'Save to Wishlist'}
                            </button>
                            <button
                                className={`btn-secondary${inCompare ? ' done' : ''}`}
                                onClick={handleCompare}
                                disabled={!inCompare && !canAddMore()}
                            >
                                <GitCompare className="w-4 h-4" style={{ marginRight: 6 }} />
                                {inCompare ? '✓ Added to Compare' : 'Add to Compare'}
                            </button>
                            <div className="cta-perks">
                                <span className="cta-perk"><span className="cta-perk-icon">✓</span> Free delivery in NBI</span>
                                <span className="cta-perk"><span className="cta-perk-icon">✓</span> 14-day returns</span>
                                {meta.warranty && <span className="cta-perk"><span className="cta-perk-icon">✓</span> {meta.warranty}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="divider" />

                {/* Features */}
                {features.length > 0 && (
                    <div className="content-sec">
                        <span className="section-tag">Why it's different</span>
                        <h2 className="section-heading">Built to stand out.</h2>
                        {product.content_overview && (
                            <p className="section-sub">{product.content_overview}</p>
                        )}
                        <div className="features-grid">
                            {features.map((f: any, i: number) => (
                                <div key={i} className="feat-card">
                                    <div className="feat-icon">{f.icon}</div>
                                    <div className="feat-title">{f.title}</div>
                                    <div className="feat-desc">{f.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <hr className="divider" />

                {/* Highlights - Manual (from admin) or Auto-extracted from specs */}
                {(() => {
                    const PRIORITY_KEYS = [
                        'Processor', 'Processor Model', 'Graphics', 'RAM', 'System Memory',
                        'Storage', 'Total Storage Capacity', 'Display Type', 'Screen Size',
                        'Screen Resolution', 'Battery', 'Battery Life', 'Operating System'
                    ];
                    let highlights: { key: string; value: string }[] = [];

                    // Priority 1: Manual highlights from admin
                    if (contentHighlights && contentHighlights.length > 0) {
                        highlights = contentHighlights.slice(0, 6).map((h: any) => ({
                            key: h.key || '',
                            value: h.value || ''
                        })).filter((h: any) => h.key && h.value);
                    }

                    // Priority 2: Auto-extract from specs if no manual highlights
                    if (highlights.length === 0) {
                        for (const priorityKey of PRIORITY_KEYS) {
                            if (highlights.length >= 6) break;
                            Object.values(specs || {}).forEach((group: any) => {
                                if (group && group[priorityKey] && !highlights.find(h => h.key === priorityKey)) {
                                    highlights.push({ key: priorityKey, value: group[priorityKey] });
                                }
                            });
                        }

                        if (highlights.length < 6) {
                            Object.values(specs || {}).forEach((group: any) => {
                                if (group && typeof group === 'object') {
                                    Object.entries(group).forEach(([key, value]) => {
                                        if (highlights.length < 6 && !highlights.find(h => h.key === key)) {
                                            highlights.push({ key, value: String(value) });
                                        }
                                    });
                                }
                            });
                        }
                    }

                    if (highlights.length === 0) return null;

                    return (
                        <div className="content-sec">
                            <span className="section-tag">Highlights</span>
                            <h2 className="section-heading">At a glance.</h2>
                            <div className="highlights-grid" style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '12px 24px',
                                marginTop: '16px'
                            }}>
                                {highlights.slice(0, 6).map((h, i) => (
                                    <div key={i} className="highlight-item" style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: '10px 0',
                                        borderBottom: '1px solid var(--border)'
                                    }}>
                                        <span className="highlight-key" style={{
                                            color: 'var(--sub)',
                                            fontWeight: 600,
                                            fontSize: '13px'
                                        }}>{h.key}</span>
                                        <span className="highlight-val" style={{
                                            color: 'var(--text)',
                                            fontWeight: 700,
                                            fontSize: '13px',
                                            textAlign: 'right'
                                        }}>{h.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}

                <hr className="divider" />

                {/* Specs */}
                {Object.keys(specs).length > 0 && (
                    <div className="content-sec">
                        <span className="section-tag">Technical specifications</span>
                        <h2 className="section-heading">The numbers.</h2>
                        <div className="specs-grid">
                            {Object.entries(specs as Record<string, any>).map(([group, fields]: [string, any]) => (
                                <div key={group}>
                                    <div className="spec-group-title">{group}</div>
                                    {Object.entries(fields).map(([key, val]) => (
                                        <div key={key} className="spec-row">
                                            <span className="spec-key">{key}</span>
                                            <span className="spec-val">{String(val)}</span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <hr className="divider" />

                {/* Reviews Section */}
                <div className="content-sec">
                    <span className="section-tag">Customer feedback</span>
                    <h2 className="section-heading">Reviews.</h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-1">
                            <ReviewSummary
                                averageRating={averageRating}
                                reviewCount={reviewCount}
                                ratingDistribution={ratingDistribution}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <ReviewList
                                reviews={reviews}
                                isLoading={reviewsLoading}
                                onHelpful={handleHelpful}
                            />
                        </div>
                    </div>
                </div>

                {/* Review Form Modal */}
                <ReviewForm
                    open={reviewFormOpen}
                    onClose={() => setReviewFormOpen(false)}
                    productId={product.id}
                    productName={product.name}
                    onSubmit={handleReviewSubmit}
                />

                <hr className="divider" />

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="content-sec">
                        <span className="section-tag">You might also like</span>
                        <h2 className="section-heading">Related Products.</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                            {relatedLoading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} style={{ background: 'var(--surface)', borderRadius: '1.5rem', padding: '1rem', border: '1px solid var(--border)' }}>
                                        <div style={{ aspectRatio: '1', background: 'var(--surface2)', borderRadius: '1rem', marginBottom: '1rem' }} />
                                        <div style={{ height: 12, background: 'var(--surface2)', borderRadius: 4, width: '70%', marginBottom: 8 }} />
                                        <div style={{ height: 16, background: 'var(--surface2)', borderRadius: 4, width: '50%' }} />
                                    </div>
                                ))
                            ) : (
                                relatedProducts.map((rp) => {
                                    const rpPrice = rp.product_variants[0]?.price_kes ? Math.round(rp.product_variants[0].price_kes / 100) : 0
                                    return (
                                        <Link
                                            key={rp.id}
                                            href={`/products/${rp.slug}`}
                                            style={{ background: 'var(--surface)', borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid var(--border)', display: 'block', transition: 'all 0.2s', textDecoration: 'none' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-4px)' }}
                                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
                                        >
                                            <div style={{ aspectRatio: '1', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                {rp.thumbnail_url ? (
                                                    <img src={rp.thumbnail_url} alt={rp.name} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                                                ) : (
                                                    <Package style={{ fontSize: '3rem', opacity: 0.3 }} />
                                                )}
                                            </div>
                                            <div style={{ padding: '1rem' }}>
                                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sub)', marginBottom: 4 }}>
                                                    {rp.brand_type}
                                                </div>
                                                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text)', marginBottom: 8, lineHeight: 1.3 }}>
                                                    {rp.name}
                                                </div>
                                                <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--accent)' }}>
                                                    {fmt(rpPrice)}
                                                </div>
                                            </div>
                                        </Link>
                                    )
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="pdp-footer">
                    <span>© 2025 Trovestak · Nairobi, Kenya</span>
                    <span>All prices in KES · VAT may apply</span>
                    <span>EA Warranty on all devices</span>
                </div>

                {/* Mobile sticky bar */}
                <div className="mobile-bar">
                    <div>
                        <div className="mb-price">{fmt(effectivePrice)}</div>
                        <div className="mb-cfg">
                            {activeColor?.name ?? ''}{activeColor && activeVariant ? ' · ' : ''}{activeVariant?.options?.storage ?? ''}
                        </div>
                    </div>
                    <button className="mb-btn" onClick={handleAddToCart}>
                        {addedToCart ? '✓ Added' : 'Add to Bag'}
                    </button>
                </div>

                {/* Pro modal */}
                <div className={`pro-overlay${proModal ? ' visible' : ''}`} onClick={() => setProModal(false)}>
                    <div className="pro-modal" onClick={e => e.stopPropagation()}>
                        <button className="pm-close" onClick={() => setProModal(false)}>✕</button>
                        <div className="pm-badge">★ Trovestak Pro</div>
                        <h2 className="pm-title">Unlock the full experience.</h2>
                        <div className="pm-benefits">
                            {[
                                { icon: <Rocket className="w-4 h-4" />, text: 'Priority shipping — Free, always' },
                                { icon: <Shield className="w-4 h-4" />, text: 'Device insurance — Coming soon' },
                                { icon: <Diamond className="w-4 h-4" />, text: 'Member-only deals & early access' },
                                { icon: <Package className="w-4 h-4" />, text: 'White-glove delivery' }
                            ].map(b => (
                                <div key={b.text} className="pm-benefit">{b.icon} {b.text}</div>
                            ))}
                        </div>
                        <div className="pm-label">Join the waitlist</div>
                        <input type="email" placeholder="your@email.com" className="pm-email" />
                        <button className="btn-primary" style={{ width: '100%' }}>Notify Me</button>
                        <div className="pm-note">Pro membership is coming soon. You'll be first to know.</div>
                    </div>
                </div>
            </div>
        </>
    )
}
