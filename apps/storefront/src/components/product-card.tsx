"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bookmark, GitCompare, Check } from "lucide-react";
import { formatPrice } from "@/lib/formatters";
import { useWishlistStore } from "@/stores/wishlist";
import { useCompareStore } from "@/stores/compare";
import { cn } from "@/lib/utils";

interface Product {
    id: string;
    slug: string;
    name: string;
    thumbnail_url?: string;
    brand_type?: string;
    content_specifications?: Record<string, Record<string, string>>;
    product_variants?: Array<{
        id: string;
        price_kes: number;
    }>;
}

interface ProductCardProps {
    product: Product;
    index?: number;
    showActions?: boolean;
}

export function ProductCard({ product, index = 0, showActions = true }: ProductCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [mounted, setMounted] = useState(false);

    const wishlistItems = useWishlistStore((s) => s.items);
    const compareProducts = useCompareStore((s) => s.products);
    const addItemToWishlist = useWishlistStore((s) => s.addItem);
    const removeFromWishlist = useWishlistStore((s) => s.removeItem);
    const addToCompare = useCompareStore((s) => s.addProduct);
    const removeFromCompare = useCompareStore((s) => s.removeProduct);
    const canAddMore = useCompareStore((s) => s.canAddMore);

    useEffect(() => {
        setMounted(true);
    }, []);

    const price = product.product_variants?.[0]?.price_kes;
    const maxPrice = product.product_variants?.reduce((max, variant) => {
        const variantPrice = variant.price_kes || 0;
        return variantPrice > max ? variantPrice : max;
    }, price || 0);

    const inWishlist = mounted && wishlistItems.some((i) => i.product_id === product.id);
    const inCompare = mounted && compareProducts.some((p) => p.id === product.id);

    const handleWishlistClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (inWishlist) {
            removeFromWishlist(product.id);
        } else {
            addItemToWishlist({
                id: product.id,
                product_id: product.id,
                variant_id: product.product_variants?.[0]?.id || "",
                title: product.name,
                unit_price: price ? Math.round(price / 100) : 0,
                thumbnail: product.thumbnail_url,
                slug: product.slug,
                added_at: new Date().toISOString(),
            });
        }
    };

    const handleCompareClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (inCompare) {
            removeFromCompare(product.id);
        } else if (canAddMore()) {
            addToCompare({
                id: product.id,
                name: product.name,
                slug: product.slug,
                thumbnail_url: product.thumbnail_url || null,
                brand_type: product.brand_type || null,
                price: price ? Math.round(price / 100) : 0,
                specs: product.content_specifications || {},
                highlights: [],
            });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                delay: index * 0.05,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1]
            }}
        >
            <Link href={`/products/${product.slug}`}>
                <motion.div
                    whileHover={{ y: -8 }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={cn(
                        "group cursor-pointer glass-card rounded-2xl p-3 border transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 overflow-hidden relative",
                        inCompare ? "border-primary/50" : "border-apple-border dark:border-apple-border-dark"
                    )}
                >
                    {/* Action Buttons */}
                    {showActions && (
                        <div className={cn(
                            "absolute top-3 right-3 z-10 flex flex-col gap-2 transition-all duration-300",
                            isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
                        )}>
                            <button
                                onClick={handleWishlistClick}
                                className={cn(
                                    "p-2 rounded-xl backdrop-blur-md border transition-all",
                                    inWishlist
                                        ? "bg-blue-500/20 border-blue-500/30 text-blue-500"
                                        : "bg-white/80 dark:bg-black/60 border-white/20 text-muted-foreground hover:text-blue-500"
                                )}
                            >
                                <Bookmark className={cn("w-4 h-4", inWishlist && "fill-current")} />
                            </button>
                            <button
                                onClick={handleCompareClick}
                                disabled={!inCompare && !canAddMore()}
                                className={cn(
                                    "p-2 rounded-xl backdrop-blur-md border transition-all",
                                    inCompare
                                        ? "bg-primary/20 border-primary/30 text-primary"
                                        : "bg-white/80 dark:bg-black/60 border-white/20 text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                                )}
                            >
                                {inCompare ? <Check className="w-4 h-4" /> : <GitCompare className="w-4 h-4" />}
                            </button>
                        </div>
                    )}

                    {/* Image Container */}
                    <div className="relative aspect-square bg-muted/30 rounded-xl overflow-hidden mb-4">
                        {product.thumbnail_url ? (
                            <Image
                                src={product.thumbnail_url}
                                alt={product.name || "Product"}
                                fill
                                priority={index < 4}
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">No Image</span>
                            </div>
                        )}

                        {/* Premium Badge */}
                        <div className="absolute top-3 left-3">
                            <div className="bg-white/80 dark:bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                                <span className="text-[8px] font-black uppercase tracking-tighter text-foreground">Premium Selection</span>
                            </div>
                        </div>

                        {/* Compare Badge */}
                        {inCompare && (
                            <div className="absolute bottom-3 left-3">
                                <div className="bg-primary/90 backdrop-blur-md px-2.5 py-1 rounded-full">
                                    <span className="text-[8px] font-black uppercase tracking-tighter text-white">Comparing</span>
                                </div>
                            </div>
                        )}

                        {/* Hover Action Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 flex items-end justify-center p-4"
                        >
                            <div className="w-full h-10 bg-white/10 dark:bg-black/40 backdrop-blur-xl rounded-xl border border-white/20 flex items-center justify-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white shadow-sm">View Details</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Product Info */}
                    <div className="space-y-1.5 px-1">
                        <h3 className="text-[15px] font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                            {product.name}
                        </h3>
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-black text-muted-foreground/80">
                                {formatPrice(price, maxPrice)}
                            </p>
                            <div className="h-1 w-1 rounded-full bg-primary/40" />
                        </div>
                    </div>
                </motion.div>
            </Link>
        </motion.div>
    );
}
