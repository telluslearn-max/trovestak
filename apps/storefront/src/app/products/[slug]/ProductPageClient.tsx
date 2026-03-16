'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '@/stores/cart'
import { useCompareStore } from '@/stores/compare'
import { formatKES } from '@/lib/formatters'
import { scrollReveal } from '@/lib/motion'
import { useConciergeTracker } from '@/hooks/useConciergeTracker'
import { submitReviewAction, markReviewHelpfulAction } from './actions'
import { ReviewSummary } from '@/components/reviews/ReviewSummary'
import { ReviewList } from '@/components/reviews/ReviewList'
import { ReviewForm } from '@/components/reviews/ReviewForm'
import { ProductCardMinimal } from '@/components/ProductCardMinimal'
import { WhatsAppCTA } from '@/components/WhatsAppCTA'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ShoppingBag, Check, ChevronDown, Package } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────
interface Variant {
    id: string
    name: string
    price_kes: number
    stock_quantity: number
    options: { storage?: string; ram?: string; [key: string]: any }
    sku?: string | null
}

interface Product {
    id: string
    name: string
    slug: string
    description: string | null
    short_desc?: string | null
    thumbnail_url: string | null
    sku: string | null
    nav_category: string | null
    nav_subcategory: string | null
    brand?: string | null
    brand_type?: string | null
    content_overview: string | null
    content_features: any
    content_specifications: any
    content_qa: any
    metadata: {
        badge?: string
        compare_price?: number
        warranty?: string
        [key: string]: any
    }
}

interface ProductPageClientProps {
    product: Product
    variants: Variant[]
    pricing?: { sell_price: number; compare_price: number; discount_percent: number; id: string } | null
    initialReviews: any[]
    initialRelated: any[]
    content?: any
    specs?: any
    addons?: any[]
}

function fmt(n: number) { return formatKES(n) }

function stockLabel(q: number) {
    if (q > 10) return 'In Stock'
    if (q > 0) return `Only ${q} left`
    return 'Out of Stock'
}

export default function ProductPageClient({
    product,
    variants,
    pricing,
    initialReviews,
    initialRelated,
    content,
    specs,
    addons,
}: ProductPageClientProps) {
    useConciergeTracker({ productId: product.id, categoryId: product.nav_category ?? undefined })

    const pricingData = pricing && pricing.sell_price > 0 ? pricing : null
    const features = typeof product.content_features === 'string'
        ? JSON.parse(product.content_features || '[]')
        : (product.content_features ?? [])
    const productSpecs: Record<string, any> = specs ?? (
        typeof product.content_specifications === 'string'
            ? JSON.parse(product.content_specifications || '{}')
            : (product.content_specifications ?? {})
    )

    const defaultVariant = variants.find(v => v.options?.is_default) ?? variants[0]
    const [activeVariant, setActiveVariant] = useState<Variant | null>(defaultVariant ?? null)
    const [addedToCart, setAddedToCart] = useState(false)
    const [reviewFormOpen, setReviewFormOpen] = useState(false)
    const [openSpecGroup, setOpenSpecGroup] = useState<string | null>(
        Object.keys(productSpecs)[0] ?? null
    )
    const [buyBarVisible, setBuyBarVisible] = useState(false)

    const heroRef = useRef<HTMLDivElement>(null)

    const basePrice = pricingData?.sell_price ?? (activeVariant?.price_kes ?? 0)
    const comparePrice = pricingData?.compare_price ?? product.metadata?.compare_price

    const { addProduct, removeProduct, isInCompare, canAddMore } = useCompareStore()
    const [reviews, setReviews] = useState(initialReviews)
    const [reviewCount] = useState(initialReviews.length)
    const [averageRating] = useState(product.metadata?.average_rating || 0)
    const [ratingDistribution, setRatingDistribution] = useState<Record<number, number>>({})

    useEffect(() => {
        if (reviews.length > 0) {
            const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            reviews.forEach((r: { rating: number }) => { dist[r.rating] = (dist[r.rating] || 0) + 1 })
            setRatingDistribution(dist)
        }
    }, [reviews])

    // Show sticky buy bar after hero scrolls out
    useEffect(() => {
        const hero = heroRef.current
        if (!hero) return
        const observer = new IntersectionObserver(
            ([entry]) => setBuyBarVisible(!entry.isIntersecting),
            { threshold: 0 }
        )
        observer.observe(hero)
        return () => observer.disconnect()
    }, [])

    const handleAddToCart = useCallback(() => {
        if (!activeVariant) return
        const { addItem } = useCartStore.getState()
        addItem({
            id: `${product.id}-${activeVariant.id}`,
            product_id: product.id,
            variant_id: activeVariant.id,
            title: `${product.name}${activeVariant.options?.storage ? ` — ${activeVariant.options.storage}` : ''}`,
            quantity: 1,
            unit_price: basePrice,
            thumbnail: product.thumbnail_url || undefined,
        })
        setAddedToCart(true)
        setTimeout(() => setAddedToCart(false), 2500)
    }, [activeVariant, product.id, product.name, product.thumbnail_url, basePrice])

    const handleReviewSubmit = async (review: { rating: number; title: string; body: string; pros: string[]; cons: string[] }) => {
        const result = await submitReviewAction(product.id, review)
        if (result.error) throw new Error(result.error)
    }

    const handleHelpful = async (reviewId: string) => {
        await markReviewHelpfulAction(reviewId)
    }

    const brandDisplay = product.brand || product.brand_type || null
    const stockText = stockLabel(activeVariant?.stock_quantity ?? variants.reduce((s, v) => s + (v.stock_quantity ?? 0), 0))
    const isOutOfStock = (activeVariant?.stock_quantity ?? 0) === 0

    return (
        <div className="min-h-screen bg-white">

            {/* ── Hero ─────────────────────────────────────────────────────────── */}
            <section ref={heroRef} className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center pt-[44px] px-4 pb-20">
                <div className="max-w-5xl w-full mx-auto text-center">
                    {brandDisplay && (
                        <p className="text-[12px] font-semibold uppercase tracking-widest text-[#6e6e73] mb-4">
                            {brandDisplay}
                        </p>
                    )}
                    <h1 className="text-[56px] md:text-[72px] font-bold text-[#1d1d1f] tracking-tight leading-[1.05] mb-6">
                        {product.name}
                    </h1>
                    {(product.short_desc || product.description) && (
                        <p className="text-[19px] text-[#6e6e73] leading-relaxed max-w-2xl mx-auto mb-4">
                            {product.short_desc || product.description}
                        </p>
                    )}
                    <p className="text-[21px] font-semibold text-[#1d1d1f] mb-10">
                        {basePrice > 0 ? `From ${fmt(basePrice)}` : 'Price on request'}
                    </p>

                    {/* Hero image */}
                    <div className="relative w-full max-w-2xl mx-auto aspect-[4/3] mb-10">
                        {product.thumbnail_url ? (
                            <Image
                                src={product.thumbnail_url}
                                alt={product.name}
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 100vw, 672px"
                                priority
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-24 h-24 text-[#6e6e73]" />
                            </div>
                        )}
                    </div>

                    {/* Hero CTAs */}
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Button
                            size="lg"
                            onClick={handleAddToCart}
                            disabled={isOutOfStock}
                            className={cn(
                                'h-12 px-8 rounded-full text-[17px] font-medium transition-all',
                                addedToCart ? 'bg-green-600 hover:bg-green-700' : 'bg-black hover:bg-[#1d1d1f]'
                            )}
                        >
                            {addedToCart ? (
                                <span className="flex items-center gap-2"><Check className="w-5 h-5" /> Added</span>
                            ) : (
                                <span className="flex items-center gap-2"><ShoppingBag className="w-5 h-5" /> Add to Bag</span>
                            )}
                        </Button>
                        <WhatsAppCTA
                            productName={product.name}
                            variant="outline"
                            className="h-12 px-8 rounded-full text-[17px] font-medium border-black text-black hover:bg-black hover:text-white"
                        />
                    </div>

                    {basePrice > 0 && (
                        <p className="text-[12px] text-[#6e6e73] mt-4">
                            {stockText}
                            {comparePrice && comparePrice > basePrice && (
                                <> · <span className="line-through">{fmt(comparePrice)}</span></>
                            )}
                        </p>
                    )}
                </div>
            </section>

            {/* ── Variant Picker ───────────────────────────────────────────────── */}
            {variants.length > 1 && (
                <section className="sticky top-[44px] z-30 bg-white/90 backdrop-blur-md border-b border-[#d2d2d7]">
                    <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                        <p className="text-[14px] font-semibold text-[#1d1d1f] shrink-0">
                            {fmt(activeVariant?.price_kes ?? 0)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {variants.map((v) => (
                                <button
                                    key={v.id}
                                    onClick={() => setActiveVariant(v)}
                                    className={cn(
                                        'px-4 py-2 rounded-full text-[14px] font-medium border transition-all',
                                        activeVariant?.id === v.id
                                            ? 'bg-black text-white border-black'
                                            : 'bg-white text-[#1d1d1f] border-[#d2d2d7] hover:border-[#1d1d1f]'
                                    )}
                                >
                                    {v.options?.storage || v.name}
                                </button>
                            ))}
                        </div>
                        <div className="sm:ml-auto">
                            <Button
                                onClick={handleAddToCart}
                                disabled={isOutOfStock}
                                className={cn(
                                    'h-9 px-6 rounded-full text-[14px] font-medium',
                                    addedToCart ? 'bg-green-600' : 'bg-black'
                                )}
                            >
                                {addedToCart ? 'Added' : 'Add to Bag'}
                            </Button>
                        </div>
                    </div>
                </section>
            )}

            {/* ── Feature Highlights ───────────────────────────────────────────── */}
            {features.length > 0 && (
                <section className="py-24 bg-white">
                    <motion.div {...scrollReveal} className="max-w-5xl mx-auto px-4">
                        {product.content_overview && (
                            <p className="text-[19px] text-[#6e6e73] text-center max-w-2xl mx-auto mb-16">
                                {product.content_overview}
                            </p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {features.map((f: any, i: number) => (
                                <motion.div
                                    key={i}
                                    {...scrollReveal}
                                    className="p-8 rounded-2xl bg-[#f5f5f7] text-center"
                                >
                                    {f.icon && (
                                        <div className="text-4xl mb-4">{f.icon}</div>
                                    )}
                                    <h3 className="text-[19px] font-semibold text-[#1d1d1f] mb-2">{f.title}</h3>
                                    <p className="text-[14px] text-[#6e6e73] leading-relaxed">{f.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </section>
            )}

            {/* ── Spec Accordion ───────────────────────────────────────────────── */}
            {Object.keys(productSpecs).length > 0 && (
                <section className="py-24 bg-[#f5f5f7]">
                    <motion.div {...scrollReveal} className="max-w-3xl mx-auto px-4">
                        <h2 className="text-[32px] font-semibold text-[#1d1d1f] mb-12 text-center">
                            Technical Specs
                        </h2>
                        <div className="space-y-1">
                            {Object.entries(productSpecs).map(([group, fields]: [string, any]) => (
                                <div key={group} className="bg-white rounded-2xl overflow-hidden">
                                    <button
                                        onClick={() => setOpenSpecGroup(openSpecGroup === group ? null : group)}
                                        className="w-full flex items-center justify-between px-6 py-4 text-left"
                                    >
                                        <span className="text-[17px] font-semibold text-[#1d1d1f]">{group}</span>
                                        <ChevronDown
                                            className={cn(
                                                'w-5 h-5 text-[#6e6e73] transition-transform duration-200',
                                                openSpecGroup === group && 'rotate-180'
                                            )}
                                        />
                                    </button>
                                    <AnimatePresence>
                                        {openSpecGroup === group && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-6 pb-5 space-y-3 border-t border-[#f5f5f7]">
                                                    {Object.entries(fields as Record<string, any>).map(([key, val]) => (
                                                        <div key={key} className="flex justify-between items-baseline gap-4 py-2 border-b border-[#f5f5f7] last:border-0">
                                                            <span className="text-[14px] text-[#6e6e73] shrink-0">{key}</span>
                                                            <span className="text-[14px] font-medium text-[#1d1d1f] text-right">{String(val)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </section>
            )}

            {/* ── Reviews ──────────────────────────────────────────────────────── */}
            <section className="py-24 bg-white">
                <motion.div {...scrollReveal} className="max-w-5xl mx-auto px-4">
                    <h2 className="text-[32px] font-semibold text-[#1d1d1f] mb-12">Ratings &amp; Reviews</h2>
                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="md:col-span-1">
                            <ReviewSummary
                                averageRating={averageRating}
                                reviewCount={reviewCount}
                                ratingDistribution={ratingDistribution}
                            />
                            <button
                                onClick={() => setReviewFormOpen(true)}
                                className="mt-6 w-full py-3 rounded-full border border-[#1d1d1f] text-[14px] font-medium text-[#1d1d1f] hover:bg-[#1d1d1f] hover:text-white transition-colors"
                            >
                                Write a Review
                            </button>
                        </div>
                        <div className="md:col-span-2">
                            <ReviewList
                                reviews={reviews}
                                isLoading={false}
                                onHelpful={handleHelpful}
                            />
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* ── Related Products ─────────────────────────────────────────────── */}
            {initialRelated.length > 0 && (
                <section className="py-24 bg-[#f5f5f7]">
                    <motion.div {...scrollReveal} className="max-w-5xl mx-auto px-4">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-[32px] font-semibold text-[#1d1d1f]">You Might Also Like</h2>
                            <Link href="/store" className="text-[14px] font-medium text-[#0071e3] hover:underline">
                                Browse all
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {initialRelated.slice(0, 3).map((rp) => (
                                <ProductCardMinimal key={rp.id} product={rp} />
                            ))}
                        </div>
                    </motion.div>
                </section>
            )}

            {/* ── Sticky Buy Bar ───────────────────────────────────────────────── */}
            <AnimatePresence>
                {buyBarVisible && (
                    <motion.div
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-[#d2d2d7]"
                    >
                        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-[14px] font-semibold text-[#1d1d1f] truncate">{product.name}</p>
                                {activeVariant && (
                                    <p className="text-[12px] text-[#6e6e73]">
                                        {activeVariant.options?.storage || activeVariant.name} · {fmt(activeVariant.price_kes)}
                                    </p>
                                )}
                            </div>
                            <Button
                                onClick={handleAddToCart}
                                disabled={isOutOfStock}
                                className={cn(
                                    'h-9 px-6 rounded-full text-[14px] font-medium shrink-0',
                                    addedToCart ? 'bg-green-600' : 'bg-black'
                                )}
                            >
                                {addedToCart ? 'Added' : 'Add to Bag'}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Review Form ──────────────────────────────────────────────────── */}
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
