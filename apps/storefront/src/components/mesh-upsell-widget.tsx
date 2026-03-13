"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ShoppingBag, Sparkles, ChevronRight, Check } from "lucide-react";
import { getUpsellRecommendations } from "@/app/actions";
import { useCartStore } from "@/stores/cart";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Recommendation {
    id: string;
    name: string;
    slug: string;
    thumbnail_url: string;
    recommendation_reason: string;
    match_strength: number;
    product_variants: {
        id: string;
        price_kes: number;
        stock_quantity: number;
    }[];
    categories: {
        name: string;
        slug: string;
    };
}

interface MeshUpsellWidgetProps {
    className?: string;
    title?: string;
    layout?: "grid" | "list";
}

export function MeshUpsellWidget({
    className,
    title = "Complete Your Ecosystem",
    layout = "list"
}: MeshUpsellWidgetProps) {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [addingId, setAddingId] = useState<string | null>(null);

    const { cart, addItem } = useCartStore();

    useEffect(() => {
        async function fetchRecommendations() {
            try {
                setIsLoading(true);
                const cartProductIds = cart?.items.map(item => item.product_id) || [];
                const { recommendations: data } = await getUpsellRecommendations(cartProductIds);
                setRecommendations(data);
            } catch (err) {
                console.error("Error fetching recommendations:", err);
                setRecommendations([]);
            } finally {
                setIsLoading(false);
            }
        }

        fetchRecommendations();
    }, [cart?.items.length]);

    const handleAddToCart = async (product: Recommendation) => {
        const variant = product.product_variants[0];
        if (!variant) return;

        setAddingId(product.id);

        addItem({
            id: Math.random().toString(36).substring(7), // Generate a unique ID for the cart item
            product_id: product.id,
            variant_id: variant.id,
            title: product.name,
            quantity: 1,
            unit_price: variant.price_kes,
            thumbnail: product.thumbnail_url
        });

        // Small delay for UI feedback
        setTimeout(() => setAddingId(null), 1500);
    };

    if (!isLoading && recommendations.length === 0) return null;

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center gap-2 mb-4 px-1">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.15em] text-foreground/80">{title}</h3>
            </div>

            <div className={cn(
                "gap-4",
                layout === "grid" ? "grid grid-cols-2 md:grid-cols-3" : "flex flex-col"
            )}>
                {isLoading ? (
                    // Skeletons
                    [1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-white/5 rounded-[1.5rem] animate-pulse" />
                    ))
                ) : (
                    <AnimatePresence mode="popLayout">
                        {recommendations.map((product, idx) => {
                            const price = product.product_variants[0]?.price_kes || 0;
                            const isLowStock = product.product_variants[0]?.stock_quantity < 5;
                            const isAdded = addingId === product.id;

                            return (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="group relative bg-[#1d1d1f]/40 backdrop-blur-xl border border-white/5 rounded-[1.5rem] p-4 hover:border-primary/20 transition-all duration-500 overflow-hidden"
                                >
                                    <div className="flex gap-4 items-center">
                                        <Link href={`/products/${product.slug}`} className="relative h-16 w-16 flex-shrink-0 bg-white/5 rounded-xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                            <img
                                                src={product.thumbnail_url || "/placeholder.png"}
                                                alt={product.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </Link>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">
                                                    {product.recommendation_reason === 'requires_tethering' ? 'Essential' : 'Recommended'}
                                                </span>
                                                {isLowStock && (
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-orange-500">
                                                        Limited Stock
                                                    </span>
                                                )}
                                            </div>
                                            <Link href={`/products/${product.slug}`}>
                                                <h4 className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">
                                                    {product.name}
                                                </h4>
                                            </Link>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-black text-white/90">
                                                    KES {(price / 100).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleAddToCart(product)}
                                            disabled={isAdded}
                                            className={cn(
                                                "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300",
                                                isAdded
                                                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                                    : "bg-white/5 text-white hover:bg-primary hover:scale-105 active:scale-95"
                                            )}
                                        >
                                            {isAdded ? (
                                                <Check className="w-5 h-5" />
                                            ) : (
                                                <Plus className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
