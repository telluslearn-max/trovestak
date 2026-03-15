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
import { 
    ShoppingBag, Smartphone, CreditCard, Truck, Shield, Package, Rocket, 
    Diamond, GitCompare, MessageCircle, Star, Heart, Share2, ArrowRight, 
    ShieldCheck, RotateCcw, Box, Check, HelpCircle
} from 'lucide-react'
import { WhatsAppCTA } from '@/components/WhatsAppCTA'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

function fmt(n: number) { return formatKES(n) }

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
        breadcrumb?: string[]
        addons?: Addons
        trade_in_devices?: TradeInGroup[]
        average_rating?: number
        review_count?: number
    }
}

interface Variant {
    id: string
    name: string
    price_kes: number
    stock_quantity: number
    options: {
        storage?: string
        ram?: string
        processor?: string
        [key: string]: any
    }
}

interface RelatedProduct {
    id: string
    name: string
    slug: string
    thumbnail_url: string | null
    brand_type: string | null
    product_variants: Variant[]
}

interface ProductPageClientProps {
    product: Product
    variants: Variant[]
    colors?: Color[]
    pricing?: { sell_price: number; compare_price: number; discount_percent: number; id: string }
    initialReviews: any[]
    initialRelated: RelatedProduct[]
    content?: any
    specs?: any
    addons?: any[]
}

function stockLabel(q: number) {
    if (q > 10) return { label: 'In Stock', cls: 'text-green-500' }
    if (q > 0) return { label: `Few left (${q})`, cls: 'text-amber-500' }
    return { label: 'Out of Stock', cls: 'text-red-500' }
}

export default function ProductPageClient({
    product,
    variants,
    colors = [],
    pricing,
    initialReviews,
    initialRelated,
    content,
    specs,
    addons
}: ProductPageClientProps) {
    useConciergeTracker({ productId: product.id })

    const meta = product.metadata || {}
    const pricingData = pricing && pricing.sell_price && pricing.sell_price > 0 ? pricing : null

    // Normalize addons from DB array to a map
    const dbAddonsMap = (addons || []).reduce((acc, a) => {
        acc[a.addon_type] = true;
        return acc;
    }, {} as Record<string, boolean>);

    // Use addons if available, otherwise fall back to metadata
    const metaAddons = Object.keys(dbAddonsMap).length > 0 ? dbAddonsMap : (meta.addons ?? {})
    const features = typeof product.content_features === 'string' ? JSON.parse(product.content_features || '[]') : (product.content_features ?? [])
    const productSpecs = specs ?? (typeof product.content_specifications === 'string' ? JSON.parse(product.content_specifications || '{}') : (product.content_specifications ?? {}))
    
    const defaultVariant = variants.find(v => v.options?.is_default) ?? variants[0]
    const [activeVariant, setActiveVariant] = useState<Variant | null>(defaultVariant ?? null)
    const [activeColor, setActiveColor] = useState<Color | null>(colors[0] ?? null)

    const [bnplMonths, setBnplMonths] = useState(6)
    const [openAddon, setOpenAddon] = useState<string | null>('bnpl')
    const [proModal, setProModal] = useState(false)
    const [addedToCart, setAddedToCart] = useState(false)
    const [savedToWishlist, setSaved] = useState(false)

    // FIX: Pricing bug - remove double division
    const basePrice: number = pricingData?.sell_price || (activeVariant ? (activeVariant.price_kes || 0) : 0) || 0

    const { addProduct, removeProduct, isInCompare, canAddMore } = useCompareStore()
    const inCompare = product.id ? isInCompare(product.id) : false

    const handleCompare = useCallback(() => {
        if (!product.id) return
        const currentPrice = pricingData ? pricingData.sell_price || 0 : (activeVariant ? (activeVariant.price_kes || 0) : 0)
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
    const [averageRating, setAverageRating] = useState(product.metadata?.average_rating || 0)
    const [ratingDistribution, setRatingDistribution] = useState<Record<number, number>>({})
    const [reviewsLoading, setReviewsLoading] = useState(false)
    const [reviewFormOpen, setReviewFormOpen] = useState(false)

    // Related products state
    const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>(initialRelated)

    const comparePrice = pricingData?.compare_price ?? meta.compare_price
    const totalStock = variants.reduce((s, v) => s + (v.stock_quantity ?? 0), 0)
    const { label: stockLbl, cls: stockCls } = stockLabel(activeVariant?.stock_quantity ?? totalStock ?? 0)

    const bnplFee = bnplMonths === 3 ? 1.0 : bnplMonths === 6 ? 1.03 : 1.06
    const bnplAmt = basePrice > 0 ? Math.ceil(basePrice * bnplFee / bnplMonths) : 0
    const effectivePrice = basePrice

    const breadcrumb: string[] = meta.breadcrumb ?? [
        'Home',
        product.nav_category ?? 'Archive',
        product.brand_type ?? 'Trove',
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
            unit_price: basePrice || 0,
            thumbnail: product.thumbnail_url || undefined,
        })
        setAddedToCart(true)
        setTimeout(() => setAddedToCart(false), 2500)
    }, [activeVariant, product.id, product.name, product.thumbnail_url, basePrice, activeColor])

    useEffect(() => {
        if (reviews.length > 0) {
            const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            reviews.forEach((r: { rating: number }) => { dist[r.rating] = (dist[r.rating] || 0) + 1 })
            setRatingDistribution(dist)
        }
    }, [reviews])

    const handleReviewSubmit = async (review: { rating: number; title: string; body: string; pros: string[]; cons: string[] }) => {
        const result = await submitReviewAction(product.id, review);
        if (result.error) throw new Error(result.error);
    }

    const handleHelpful = async (reviewId: string) => {
        await markReviewHelpfulAction(reviewId);
    }

    const heroImage = product.thumbnail_url

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
            {/* Sub-nav */}
            <nav className="sticky top-0 z-[40] w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
                <div className="container mx-auto max-w-7xl h-14 flex items-center px-4">
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                        {breadcrumb.map((crumb, i) => (
                            <div key={i} className="flex items-center gap-3">
                                {i > 0 && <span className="text-border">/</span>}
                                <span className="hover:text-primary transition-colors cursor-pointer">{crumb}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </nav>

            <main className="container mx-auto max-w-7xl px-6 py-12 md:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-start">
                    
                    {/* Gallery Section */}
                    <div className="sticky top-28 space-y-6">
                        <div className="relative aspect-square rounded-[2.5rem] glass-card border-border/40 overflow-hidden flex items-center justify-center group">
                            {heroImage ? (
                                <motion.img
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                    src={heroImage}
                                    alt={product.name}
                                    className="w-[88%] h-[88%] object-contain"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-6 text-muted-foreground/30">
                                    <Smartphone className="w-24 h-24 stroke-[0.5]" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.3em]">No Visual Data</span>
                                </div>
                            )}
                            
                            {meta.badge && (
                                <div className="absolute top-8 left-8">
                                    <Badge className="bg-primary text-primary-foreground font-black px-5 py-1.5 rounded-full uppercase tracking-widest border-none shadow-xl shadow-primary/20">
                                        {meta.badge}
                                    </Badge>
                                </div>
                            )}
                            
                            <div className={cn(
                                "absolute top-8 right-8 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-xl",
                                stockCls.includes('green') 
                                    ? "bg-green-500/10 border-green-500/20 text-green-500" 
                                    : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                            )}>
                                {stockLbl}
                            </div>
                        </div>
                    </div>

                    {/* Product Info Section */}
                    <div className="space-y-16">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-4 px-4 py-1.5 bg-primary/5 border border-primary/10 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                                    {product.nav_subcategory} · {product.brand_type}
                                </span>
                            </div>
                            
                            <h1 className="text-5xl md:text-7xl font-black font-dm-sans tracking-tightest leading-[0.9] text-balance">
                                {product.name}
                            </h1>
                            
                            {(product.sku || meta.model) && (
                                <div className="flex items-center gap-5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">
                                    {product.sku && <span>ID: {product.sku}</span>}
                                    {meta.model && <span className="flex items-center gap-4"><div className="w-1.5 h-1.5 rounded-full bg-border" /> {meta.model}</span>}
                                </div>
                            )}

                            {product.description && (
                                <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-xl">
                                    {product.description}
                                </p>
                            )}
                        </div>

                        {/* Price Area */}
                        <div className="space-y-6 pb-12 border-b border-border/40">
                            <div className="flex items-baseline gap-6 font-dm-sans">
                                <span className="text-6xl font-black tracking-tightest text-primary">
                                    {fmt(effectivePrice)}
                                </span>
                                {comparePrice && comparePrice > basePrice && (
                                    <span className="text-2xl font-bold text-muted-foreground/30 line-through decoration-primary/20">
                                        {fmt(comparePrice)}
                                    </span>
                                )}
                            </div>
                            
                            {basePrice > 0 && metaAddons.bnpl && (
                                <button className="flex items-center gap-3 group">
                                    <Badge variant="outline" className="text-[10px] font-black border-primary/20 text-primary uppercase px-3 py-1 bg-primary/5">
                                        BNPL Ready
                                    </Badge>
                                    <span className="text-xs font-bold text-muted-foreground/60 group-hover:text-primary transition-colors">
                                        From {fmt(bnplAmt)} monthly
                                    </span>
                                </button>
                            )}
                        </div>

                        {/* Configurator */}
                        <div className="space-y-12">
                            {/* Colors */}
                            {colors.length > 0 && (
                                <div className="space-y-6">
                                    <label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                                        Premium Finish — {activeColor?.name}
                                    </label>
                                    <div className="flex gap-5">
                                        {colors.map((c, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setActiveColor(c)}
                                                className={cn(
                                                    "relative w-12 h-12 rounded-full transition-all p-0.5 border-2",
                                                    activeColor?.name === c.name ? "border-primary scale-110 shadow-lg shadow-primary/20" : "border-transparent hover:border-border"
                                                )}
                                            >
                                                <div 
                                                    className="w-full h-full rounded-full border border-black/10 shadow-inner" 
                                                    style={{ background: c.hex1 }} 
                                                />
                                                {activeColor?.name === c.name && (
                                                    <motion.div 
                                                        layoutId="activeColor"
                                                        className="absolute inset-[-6px] rounded-full border-2 border-primary"
                                                    />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Storage Capacity */}
                            <div className="space-y-6">
                                <label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                                    Configuration
                                </label>
                                <div className="grid grid-cols-1 gap-4">
                                    {variants.map((v) => (
                                        <button
                                            key={v.id}
                                            onClick={() => setActiveVariant(v)}
                                            className={cn(
                                                "relative flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all text-left group overflow-hidden",
                                                activeVariant?.id === v.id 
                                                    ? "border-primary bg-primary/5 shadow-2xl shadow-primary/10" 
                                                    : "bg-surface border-border/40 hover:border-border hover:bg-muted/10"
                                            )}
                                        >
                                            <div className="flex flex-col gap-1">
                                                <span className="text-base font-black uppercase tracking-wider font-dm-sans">{v.options?.storage || v.name}</span>
                                                <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">{v.stock_quantity > 0 ? 'In Stock — Ready to Ship' : 'Pre-order Available'}</span>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-base font-black text-primary font-dm-sans">{fmt(v.price_kes)}</span>
                                                {activeVariant?.id === v.id && (
                                                    <Check className="w-5 h-5 text-primary" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* CTAs */}
                            <div className="space-y-6 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Button 
                                        size="lg"
                                        onClick={handleAddToCart}
                                        disabled={(activeVariant?.stock_quantity ?? 0) === 0}
                                        className={cn(
                                            "h-16 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-xl",
                                            addedToCart ? "bg-green-500 hover:bg-green-600 shadow-green-500/20" : "shadow-primary/20"
                                        )}
                                    >
                                        {addedToCart ? (
                                            <span className="flex items-center gap-3"><Check className="w-5 h-5" /> Added to Case</span>
                                        ) : (
                                            <span className="flex items-center gap-3"><ShoppingBag className="w-5 h-5" /> Add to Case</span>
                                        )}
                                    </Button>

                                    <WhatsAppCTA 
                                        productName={product.name} 
                                        variant="outline"
                                        className="h-16 rounded-[1.5rem] bg-white dark:bg-black border-border/60 hover:bg-muted/20"
                                    />
                                </div>

                                <div className="flex flex-wrap gap-x-10 gap-y-6 pt-10 border-t border-border/20">
                                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 group">
                                        <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                            <Truck className="w-4 h-4" />
                                        </div>
                                        Express Delivery
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 group">
                                        <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        {meta.warranty || '2 Year Care'}
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 group">
                                        <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                            <RotateCcw className="w-4 h-4" />
                                        </div>
                                        14-Day Exchange
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                {features.length > 0 && (
                    <section className="py-24 border-t border-border/40 mt-24">
                        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16 space-y-4">
                            <Badge variant="outline" className="border-primary/20 text-primary font-black px-4 py-1 uppercase tracking-widest">
                                Innovations
                            </Badge>
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight tracking-tighter">
                                Engineered to inspire.
                            </h2>
                            {product.content_overview && (
                                <p className="text-lg text-muted-foreground font-medium">
                                    {product.content_overview}
                                </p>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {features.map((f: any, i: number) => (
                                <motion.div 
                                    key={i}
                                    whileHover={{ y: -8 }}
                                    className="p-10 rounded-[32px] bg-muted/20 border border-border/50 hover:border-primary/20 hover:bg-muted/30 transition-all group"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                                        <div className="text-2xl">{f.icon}</div>
                                    </div>
                                    <h3 className="text-xl font-black tracking-tight mb-4">{f.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed font-medium">{f.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Technical Specs */}
                {productSpecs && Object.keys(productSpecs).length > 0 && (
                    <section className="py-24 border-t border-border/40">
                        <div className="mb-16">
                            <Badge variant="outline" className="border-border text-muted-foreground font-black px-4 py-1 uppercase tracking-widest mb-4">
                                Full Specs
                            </Badge>
                            <h2 className="text-4xl font-black tracking-tight">The numbers.</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-24 gap-y-12">
                            {Object.entries(productSpecs as Record<string, any>).map(([group, fields]: [string, any]) => (
                                <div key={group} className="space-y-6">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border-b border-primary/10 pb-4">
                                        {group}
                                    </h4>
                                    <div className="space-y-4">
                                        {Object.entries(fields).map(([key, val]) => (
                                            <div key={key} className="flex justify-between items-baseline group">
                                                <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">{key}</span>
                                                <div className="flex-1 border-b border-dotted border-border/50 mx-4" />
                                                <span className="text-xs font-black text-right">{String(val)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Reviews */}
                <section className="py-24 border-t border-border/40">
                    <div className="mb-16">
                        <Badge variant="outline" className="border-border text-muted-foreground font-black px-4 py-1 uppercase tracking-widest mb-4">
                            Feedback
                        </Badge>
                        <h2 className="text-4xl font-black tracking-tight">Reviews.</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-16">
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
                </section>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <section className="py-24 border-t border-border/40">
                        <div className="flex items-center justify-between mb-16">
                            <h2 className="text-4xl font-black tracking-tight">You might also like.</h2>
                            <Link href="/store" className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:text-primary transition-colors">
                                Browse all <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {relatedProducts.map((rp) => {
                                const rpPrice = rp.product_variants[0]?.price_kes || 0
                                return (
                                    <Link
                                        key={rp.id}
                                        href={`/products/${rp.slug}`}
                                        className="group space-y-4"
                                    >
                                        <div className="aspect-square rounded-3xl bg-muted/20 border border-border/50 overflow-hidden flex items-center justify-center transition-all group-hover:border-primary/20 group-hover:bg-muted/30">
                                            {rp.thumbnail_url ? (
                                                <img 
                                                    src={rp.thumbnail_url} 
                                                    alt={rp.name} 
                                                    className="w-[70%] h-[70%] object-contain transition-transform duration-500 group-hover:scale-110" 
                                                />
                                            ) : (
                                                <Box className="w-12 h-12 text-muted-foreground/20" />
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                {rp.brand_type}
                                            </div>
                                            <h4 className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors">
                                                {rp.name}
                                            </h4>
                                            <div className="font-black text-sm text-primary">
                                                {fmt(rpPrice)}
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </section>
                )}
            </main>

            {/* Mobile sticky bar */}
            <div className="md:hidden fixed bottom-6 left-6 right-6 z-[50]">
                <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-2xl flex items-center justify-between">
                    <div>
                        <div className="text-lg font-black tracking-tight text-primary">{fmt(effectivePrice)}</div>
                        <div className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                            {activeVariant?.options?.storage || 'Standard'} 
                        </div>
                    </div>
                    <Button onClick={handleAddToCart} size="sm" className="font-black text-[10px] uppercase tracking-widest px-6 h-10 rounded-xl">
                        {addedToCart ? 'Added' : 'Add to Bag'}
                    </Button>
                </div>
            </div>

            {/* Pro modal */}
            <AnimatePresence>
                {proModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setProModal(false)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-md" 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-sm bg-background border border-border rounded-[40px] p-8 shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
                            <div className="flex flex-col items-center text-center space-y-6">
                                <Badge className="bg-primary/10 text-primary border-primary/20 font-black px-4 py-1 uppercase tracking-widest">
                                    ★ Elite Deck
                                </Badge>
                                <h2 className="text-2xl font-black tracking-tight">Unlock the full experience.</h2>
                                
                                <div className="space-y-3 w-full text-left">
                                    {[
                                        { icon: <Rocket className="w-4 h-4" />, text: 'Priority Shipping — Free Always' },
                                        { icon: <ShieldCheck className="w-4 h-4" />, text: 'Extended 2-Year Warranty' },
                                        { icon: <Diamond className="w-4 h-4" />, text: 'Member-Only Flash Sales' },
                                    ].map((b, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                                            <div className="text-primary">{b.icon}</div>
                                            <span className="text-xs font-bold leading-none">{b.text}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Product Specifications Section (if available) */}
                                {productSpecs && Object.keys(productSpecs).length > 0 && (
                                    <div className="mt-16 pt-16 border-t border-border/30">
                                        <h3 className="text-xl font-black text-foreground mb-8">Technical Specifications</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                            {Object.entries(productSpecs).map(([key, value]) => (
                                                <div key={key} className="flex justify-between py-3 border-b border-border/10">
                                                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">{key}</span>
                                                    <span className="text-sm font-bold text-foreground">{String(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="space-y-4 w-full">
                                    <input 
                                        type="email" 
                                        placeholder="your@email.com" 
                                        className="w-full h-12 bg-muted/30 border border-border rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                                    />
                                    <Button className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest">
                                        Join Waitlist
                                    </Button>
                                </div>
                                <p className="text-[10px] text-muted-foreground font-medium">Coming soon to selected areas in Nairobi.</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Review Form */}
            <ReviewForm
                open={reviewFormOpen}
                onClose={() => setReviewFormOpen(false)}
                productId={product.id}
                productName={product.name}
                onSubmit={handleReviewSubmit}
            />
        </div>
    )
}
