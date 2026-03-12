"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, Package } from "lucide-react";
import { formatKES } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface Product {
    id: string;
    name: string;
    slug: string;
    thumbnail_url: string | null;
    brand_type: string | null;
    price?: number;
    viewed_at?: string;
}

interface RecentlyViewedProps {
    currentProductId?: string;
    className?: string;
}

const STORAGE_KEY = "trovestak-recently-viewed";
const MAX_ITEMS = 10;

export function RecentlyViewed({ currentProductId, className }: RecentlyViewedProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [scrollPosition, setScrollPosition] = useState(0);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Filter out current product
                const filtered = currentProductId
                    ? parsed.filter((p: Product) => p.id !== currentProductId)
                    : parsed;
                setProducts(filtered.slice(0, 6));
            } catch (e) {
                setProducts([]);
            }
        }
    }, [currentProductId]);

    const scroll = (direction: "left" | "right") => {
        const container = document.getElementById("recently-viewed-scroll");
        if (container) {
            const scrollAmount = 220;
            container.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
            setScrollPosition(container.scrollLeft);
        }
    };

    if (products.length === 0) return null;

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                        Recently Viewed
                    </h3>
                </div>
                {products.length > 4 && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => scroll("left")}
                            className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => scroll("right")}
                            className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            <div
                id="recently-viewed-scroll"
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                <AnimatePresence mode="popLayout">
                    {products.map((product, i) => (
                        <motion.div
                            key={product.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Link
                                href={`/products/${product.slug}`}
                                className="group flex-shrink-0 w-48 bg-muted/20 rounded-2xl overflow-hidden border border-border/30 hover:border-primary/30 transition-all cursor-pointer"
                            >
                                <div className="relative aspect-square bg-muted/10">
                                    {product.thumbnail_url ? (
                                        <Image
                                            src={product.thumbnail_url}
                                            alt={product.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Package className="w-8 h-8 text-muted-foreground/30" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                        {product.brand_type}
                                    </p>
                                    <h4 className="text-sm font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                                        {product.name}
                                    </h4>
                                    {product.price !== undefined && (
                                        <p className="text-sm font-black text-foreground mt-2">
                                            {formatKES(product.price)}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Helper to add product to recently viewed
export function addToRecentlyViewed(product: Product) {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(STORAGE_KEY);
    let items: Product[] = stored ? JSON.parse(stored) : [];

    // Remove if already exists
    items = items.filter(p => p.id !== product.id);

    // Add to front
    items.unshift({
        ...product,
        viewed_at: new Date().toISOString(),
    });

    // Keep max items
    items = items.slice(0, MAX_ITEMS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
