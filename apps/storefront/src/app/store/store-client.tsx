"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/product-card";
import { StoreFilters } from "@/components/store-filters";

interface Category {
    id: string;
    name: string;
    slug: string;
    parent_id: string | null;
}

interface StoreClientProps {
    categories: Category[];
    products: any[];
    brands: string[];
    category?: string;
    subcategory?: string;
    brand?: string;
    sort?: string;
}

export function StoreClient({
    categories,
    products,
    brands,
    category,
    subcategory,
    brand,
    sort
}: StoreClientProps) {
    const isGaming = category === "gaming";

    return (
        <div className={cn(
            "min-h-screen pt-32 pb-24 px-4 md:px-8 transition-colors duration-1000 selection:bg-primary/20",
            isGaming ? "bg-[#050505] text-white" : "bg-background text-foreground"
        )}>
            {isGaming && (
                <div className="fixed inset-0 pointer-events-none opacity-20 -z-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.1),transparent_50%)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[length:100%_2px,3px_100%]" />
                </div>
            )}
            {/* Premium Hero Section */}
            <div className="max-w-7xl mx-auto mb-16">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-6"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Live Inventory</span>
                    </div>

                    <h1 className={cn(
                        "text-5xl md:text-7xl font-black tracking-tight leading-[1.1]",
                        isGaming ? "text-white" : "text-foreground"
                    )}>
                        {isGaming ? "Elite Deck." : "The Store."} <br />
                        <span className={cn(
                            "italic font-serif",
                            isGaming ? "text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" : "text-muted-foreground/40"
                        )}>
                            {isGaming ? "High performance." : "Curated excellence."}
                        </span>
                    </h1>

                    <p className={cn(
                        "max-w-2xl text-lg md:text-xl font-medium leading-relaxed",
                        isGaming ? "text-muted-foreground" : "text-muted-foreground"
                    )}>
                        {isGaming
                            ? "Equipping the vanguard of digital competition. Explore hyper-responsive peripherals and overclocked hardware."
                            : "Discover our collection of premium tech, gaming gear, and specialized equipment. Engineered for those who demand the absolute best."
                        }
                    </p>
                </motion.div>

                {/* Category Navigation - Premium Scroller */}
                <div className="mt-16 relative">
                    <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
                        <Link
                            href="/store"
                            className={cn(
                                "whitespace-nowrap px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-500 border",
                                !category
                                    ? "bg-foreground text-background border-foreground shadow-2xl shadow-foreground/20 scale-105"
                                    : "bg-muted/30 text-muted-foreground border-transparent hover:border-muted-foreground/20 hover:bg-muted/50"
                            )}
                        >
                            All Equipment
                        </Link>
                        {categories.filter((c: any) => !c.parent_id).map((cat: any) => (
                            <Link
                                key={cat.id}
                                href={`/store?category=${cat.slug}`}
                                className={cn(
                                    "whitespace-nowrap px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-500 border",
                                    category === cat.slug
                                        ? "bg-foreground text-background border-foreground shadow-2xl shadow-foreground/20 scale-105"
                                        : "bg-muted/30 text-muted-foreground border-transparent hover:border-muted-foreground/20 hover:bg-muted/50"
                                )}
                            >
                                {cat.name}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Subcategory Pills (only if category is selected) */}
                {category && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-wrap gap-2 mt-6"
                    >
                        {categories
                            .filter((c: Category) => c.parent_id && categories.find((p: Category) => p.slug === category && p.id === c.parent_id))
                            .map((sub: Category) => (
                                <Link
                                    key={sub.id}
                                    href={`/store?category=${category}&subcategory=${sub.slug}`}
                                    className={cn(
                                        "px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border",
                                        subcategory === sub.slug
                                            ? "bg-primary/10 border-primary text-primary"
                                            : "bg-background border-border/50 text-muted-foreground hover:border-muted-foreground"
                                    )}
                                >
                                    {sub.name}
                                </Link>
                            ))}
                    </motion.div>
                )}

                <div className="mt-20 border-t border-apple-border dark:border-apple-border-dark pt-12">
                    <StoreFilters
                        brands={brands}
                        currentBrand={brand}
                        currentSort={sort}
                    />
                </div>
            </div>

            {/* Product Grid */}
            <div className="max-w-7xl mx-auto">
                <AnimatePresence mode="wait">
                    {products.length > 0 ? (
                        <motion.div
                            key={category + (subcategory ?? '') + (brand ?? '') + (sort ?? '')}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10"
                        >
                            {products.map((product: any, index: number) => (
                                <ProductCard key={product.id} product={product} index={index} />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-32 glass-card rounded-3xl border-dashed border-2 border-muted"
                        >
                            <h3 className="text-3xl font-black tracking-tighter text-foreground mb-4">No Gear Found</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto font-medium">
                                We couldn&apos;t find any products matching your current filters. Try expanding your search.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
