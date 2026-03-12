"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Trash2, ShoppingBag, ArrowRight, Package } from "lucide-react";
import { useWishlistStore } from "@/stores/wishlist";
import { useCartStore } from "@/stores/cart";
import { formatKES } from "@/lib/formatters";
import { Button } from "@/components/ui/button";

interface WishlistClientProps {
    initialItems: any[];
}

export default function WishlistClient({ initialItems }: WishlistClientProps) {
    const { items, isLoading, setItems, removeItem, moveToCart } = useWishlistStore();
    const { addItem } = useCartStore();

    // Hydrate store from server data
    useEffect(() => {
        if (initialItems.length > 0) {
            setItems(initialItems);
        }
    }, [initialItems, setItems]);

    const handleMoveToCart = async (productId: string) => {
        await moveToCart(productId, addItem);
    };

    if (items.length === 0 && !isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full text-center"
                >
                    <div className="w-24 h-24 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                        <Heart className="w-12 h-12 text-rose-500" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground mb-4">
                        Your Wishlist is <span className="text-muted-foreground/40 italic">Empty</span>
                    </h1>
                    <p className="text-muted-foreground mb-10">
                        Save items you love by clicking the heart icon on any product.
                    </p>
                    <Link
                        href="/store"
                        className="inline-flex items-center justify-center px-10 py-4 bg-foreground text-background rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all"
                    >
                        Start Browsing
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pt-32 pb-24 px-4 md:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <Heart className="w-8 h-8 text-rose-500" />
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground">
                            Wishlist<span className="text-rose-500">.</span>
                        </h1>
                    </div>
                    <p className="text-lg text-muted-foreground">
                        {items.length} {items.length === 1 ? "item" : "items"} saved for later
                    </p>
                </motion.div>

                {/* Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">
                        {isLoading ? (
                            // Skeletons
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="bg-muted/20 rounded-2xl p-4 animate-pulse">
                                    <div className="aspect-square bg-muted/30 rounded-xl mb-4" />
                                    <div className="h-4 bg-muted/30 rounded w-3/4 mb-2" />
                                    <div className="h-4 bg-muted/30 rounded w-1/2" />
                                </div>
                            ))
                        ) : (
                            items.map((item, index) => (
                                <motion.div
                                    key={item.product_id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group bg-muted/20 rounded-[2rem] overflow-hidden border border-border/30 hover:border-rose-500/30 transition-all cursor-pointer"
                                >
                                    {/* Image */}
                                    <Link href={`/products/${item.slug}`}>
                                        <div className="relative aspect-square bg-muted/10">
                                            {item.thumbnail ? (
                                                <Image
                                                    src={item.thumbnail}
                                                    alt={item.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="w-10 h-10 text-muted-foreground/30" />
                                                </div>
                                            )}
                                        </div>
                                    </Link>

                                    {/* Content */}
                                    <div className="p-5">
                                        <Link href={`/products/${item.slug}`}>
                                            <h3 className="font-bold text-foreground line-clamp-2 mb-2 group-hover:text-rose-500 transition-colors">
                                                {item.title}
                                            </h3>
                                        </Link>
                                        <p className="text-xl font-black text-foreground mb-4">
                                            {formatKES(item.unit_price * 100)} {/* Convert back to cents for formatter if needed, but actions return cents*100 ? Wait. */}
                                            {/* getWishlistItemsAction returns unit_price in KES. formatKES expects cents. */}
                                            {formatKES(item.unit_price * 100)}
                                        </p>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleMoveToCart(item.product_id)}
                                                className="flex-1 h-11 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-bold text-sm"
                                            >
                                                <ShoppingBag className="w-4 h-4 mr-2" />
                                                Add to Cart
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => removeItem(item.product_id)}
                                                className="h-11 w-11 rounded-xl border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                {/* Continue Shopping */}
                <div className="mt-16 text-center">
                    <Link
                        href="/store"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium"
                    >
                        <ArrowRight className="w-4 h-4 rotate-180" />
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
}
