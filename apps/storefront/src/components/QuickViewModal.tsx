"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Minus, Plus, ShoppingBag, Heart, ChevronRight, Package } from "lucide-react";
import { formatKES } from "@/lib/formatters";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";

interface QuickViewProduct {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    thumbnail_url: string | null;
    brand_type: string | null;
    average_rating?: number;
    review_count?: number;
    product_variants: Array<{
        id: string;
        name: string;
        price_kes: number;
        stock_quantity: number;
        options?: Record<string, any>;
    }>;
    metadata?: Record<string, any>;
}

interface QuickViewModalProps {
    product: QuickViewProduct | null;
    open: boolean;
    onClose: () => void;
}

export function QuickViewModal({ product, open, onClose }: QuickViewModalProps) {
    const [selectedVariant, setSelectedVariant] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const { addItem } = useCartStore();
    const { isInWishlist, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();

    if (!product) return null;

    const variants = product.product_variants || [];
    const currentVariant = variants[selectedVariant] || variants[0];
    const price = currentVariant?.price_kes ? Math.round(currentVariant.price_kes / 100) : 0;
    const comparePrice = product.metadata?.compare_price || 0;
    const discount = comparePrice > price ? Math.round((1 - price / comparePrice) * 100) : 0;
    const inWishlist = mounted && isInWishlist(product.id);
    const inStock = (currentVariant?.stock_quantity || 0) > 0;

    const handleAddToCart = () => {
        if (!currentVariant || !inStock) return;

        addItem({
            id: `${product.id}-${currentVariant.id}`,
            product_id: product.id,
            variant_id: currentVariant.id,
            title: `${product.name}${currentVariant.options?.storage ? ` — ${currentVariant.options.storage}` : ''}`,
            quantity,
            unit_price: price,
            thumbnail: product.thumbnail_url || undefined,
        });

        setAddedToCart(true);
        setTimeout(() => {
            setAddedToCart(false);
            onClose();
        }, 1500);
    };

    const handleWishlist = () => {
        if (inWishlist) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist({
                id: product.id,
                product_id: product.id,
                variant_id: currentVariant?.id || "",
                title: product.name,
                unit_price: price,
                thumbnail: product.thumbnail_url ?? undefined,
                slug: product.slug,
                added_at: new Date().toISOString(),
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto bg-background border-border/50 rounded-[2rem] p-0">
                <DialogClose className="absolute top-4 right-4 z-10 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors">
                    <X className="w-5 h-5" />
                </DialogClose>

                <div className="grid md:grid-cols-2 gap-0">
                    {/* Image Section */}
                    <div className="relative aspect-square bg-muted/20">
                        {product.thumbnail_url ? (
                            <Image
                                src={product.thumbnail_url}
                                alt={product.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-16 h-16 text-muted-foreground/30" />
                            </div>
                        )}

                        {/* Discount Badge */}
                        {discount > 0 && (
                            <div className="absolute top-4 left-4 px-3 py-1.5 bg-red-500 text-white text-xs font-black rounded-full">
                                -{discount}% OFF
                            </div>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="p-8 flex flex-col">
                        {/* Brand */}
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                            {product.brand_type}
                        </p>

                        {/* Title */}
                        <Link href={`/products/${product.slug}`} className="hover:text-primary transition-colors">
                            <h2 className="text-2xl font-black tracking-tight text-foreground mb-3">
                                {product.name}
                            </h2>
                        </Link>

                        {/* Rating */}
                        {product.average_rating !== undefined && product.average_rating > 0 && (
                            <div className="flex items-center gap-2 mb-4">
                                <div className="flex">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={cn(
                                                "w-4 h-4",
                                                i < Math.round(product.average_rating || 0)
                                                    ? "text-amber-400 fill-amber-400"
                                                    : "text-muted-foreground/20"
                                            )}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {product.average_rating.toFixed(1)} ({product.review_count} reviews)
                                </span>
                            </div>
                        )}

                        {/* Description */}
                        {product.description && (
                            <p className="text-sm text-muted-foreground mb-6 line-clamp-3">
                                {product.description}
                            </p>
                        )}

                        {/* Price */}
                        <div className="flex items-baseline gap-3 mb-6">
                            <span className="text-3xl font-black text-foreground">
                                {formatKES(price)}
                            </span>
                            {comparePrice > price && (
                                <span className="text-lg font-bold text-muted-foreground/50 line-through">
                                    {formatKES(comparePrice)}
                                </span>
                            )}
                        </div>

                        {/* Variants */}
                        {variants.length > 1 && (
                            <div className="mb-6">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                                    Select Option
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {variants.map((variant, i) => (
                                        <button
                                            key={variant.id}
                                            onClick={() => setSelectedVariant(i)}
                                            className={cn(
                                                "px-4 py-2 rounded-xl border text-sm font-bold transition-all",
                                                selectedVariant === i
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-border/50 hover:border-primary/30"
                                            )}
                                        >
                                            {variant.options?.storage || variant.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity */}
                        <div className="flex items-center gap-4 mb-6">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Quantity
                            </p>
                            <div className="flex items-center bg-muted/30 rounded-xl p-1">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-12 text-center font-bold">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Stock Status */}
                        <div className="mb-6">
                            {inStock ? (
                                <span className="text-sm font-bold text-emerald-500">
                                    ✓ In Stock ({currentVariant?.stock_quantity} available)
                                </span>
                            ) : (
                                <span className="text-sm font-bold text-red-500">
                                    ✗ Out of Stock
                                </span>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-auto">
                            <Button
                                onClick={handleAddToCart}
                                disabled={!inStock || addedToCart}
                                className={cn(
                                    "flex-1 h-12 rounded-xl font-bold gap-2",
                                    addedToCart ? "bg-emerald-500 hover:bg-emerald-500" : "bg-foreground text-background"
                                )}
                            >
                                {addedToCart ? (
                                    <>
                                        <ShoppingBag className="w-4 h-4" />
                                        Added!
                                    </>
                                ) : (
                                    <>
                                        <ShoppingBag className="w-4 h-4" />
                                        Add to Cart
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleWishlist}
                                className={cn(
                                    "h-12 w-12 rounded-xl",
                                    inWishlist && "border-rose-500/50 text-rose-500"
                                )}
                            >
                                <Heart className={cn("w-5 h-5", inWishlist && "fill-current")} />
                            </Button>
                        </div>

                        {/* View Full Details */}
                        <Link
                            href={`/products/${product.slug}`}
                            className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-primary hover:underline"
                        >
                            View Full Details
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
