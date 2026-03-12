"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, GitCompare, Trash2, Check, Package } from "lucide-react";
import { useCompareStore } from "@/stores/compare";
import { formatKES } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

interface CompareDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CompareDrawer({ open, onOpenChange }: CompareDrawerProps) {
    const { products, removeProduct, clearCompare } = useCompareStore();

    // Get all unique spec keys across all products
    const allSpecGroups = new Set<string>();
    const allSpecKeys: Record<string, Set<string>> = {};

    products.forEach(p => {
        Object.entries(p.specs).forEach(([group, items]) => {
            allSpecGroups.add(group);
            if (!allSpecKeys[group]) allSpecKeys[group] = new Set();
            Object.keys(items).forEach(key => allSpecKeys[group].add(key));
        });
    });

    // Highlight differences
    const getSpecHighlight = (group: string, key: string) => {
        const values = products.map(p => p.specs[group]?.[key]).filter(Boolean);
        const uniqueValues = new Set(values);
        return uniqueValues.size > 1; // Highlight if different
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-6xl overflow-x-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <GitCompare className="w-5 h-5 text-primary" />
                        Compare Products ({products.length})
                    </SheetTitle>
                </SheetHeader>

                {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <GitCompare className="w-16 h-16 text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground">
                            Add products to compare (up to 4)
                        </p>
                    </div>
                ) : (
                    <div className="mt-6">
                        {/* Product Headers */}
                        <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: `200px repeat(${products.length}, 1fr)` }}>
                            <div className="p-4">
                                <Button
                                    variant="outline"
                                    onClick={clearCompare}
                                    className="w-full text-sm"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Clear All
                                </Button>
                            </div>
                            {products.map((product) => (
                                <div
                                    key={product.id}
                                    className="bg-muted/20 rounded-2xl p-4 border border-border/30"
                                >
                                    <div className="relative aspect-square bg-muted/10 rounded-xl mb-4 overflow-hidden">
                                        {product.thumbnail_url ? (
                                            <Image
                                                src={product.thumbnail_url}
                                                alt={product.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package className="w-8 h-8 text-muted-foreground/30" />
                                            </div>
                                        )}
                                        <button
                                            onClick={() => removeProduct(product.id)}
                                            className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full text-muted-foreground hover:text-rose-500 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <Link
                                        href={`/products/${product.slug}`}
                                        className="block"
                                    >
                                        <h4 className="font-bold text-foreground line-clamp-2 mb-2 hover:text-primary transition-colors">
                                            {product.name}
                                        </h4>
                                    </Link>
                                    <p className="text-lg font-black text-foreground">
                                        {formatKES(product.price)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Specs Comparison */}
                        {Array.from(allSpecGroups).map((group) => (
                            <div key={group} className="mb-6">
                                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-3 px-4">
                                    {group}
                                </h3>
                                <div
                                    className="grid gap-2"
                                    style={{ gridTemplateColumns: `200px repeat(${products.length}, 1fr)` }}
                                >
                                    {Array.from(allSpecKeys[group] || []).map((key) => {
                                        const highlight = getSpecHighlight(group, key);
                                        return (
                                            <div
                                                key={key}
                                                className="contents"
                                            >
                                                <div className="p-3 bg-muted/10 rounded-lg">
                                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                                        {key}
                                                    </span>
                                                </div>
                                                {products.map((product) => {
                                                    const value = product.specs[group]?.[key];
                                                    return (
                                                        <div
                                                            key={product.id}
                                                            className={cn(
                                                                "p-3 rounded-lg text-sm font-medium text-center",
                                                                highlight && value
                                                                    ? "bg-amber-500/10 border border-amber-500/20"
                                                                    : "bg-muted/5"
                                                            )}
                                                        >
                                                            {value || "-"}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

// Compare bar that shows at bottom when products are selected
export function CompareBar() {
    const { products, isInCompare } = useCompareStore();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || products.length === 0) return null;

    return (
        <>
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border p-4"
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <GitCompare className="w-5 h-5 text-primary" />
                        <span className="text-sm font-bold">
                            {products.length} product{products.length !== 1 ? "s" : ""} selected for comparison
                        </span>
                        <div className="flex gap-2">
                            {products.slice(0, 4).map((p) => (
                                <div
                                    key={p.id}
                                    className="w-10 h-10 rounded-lg bg-muted/30 overflow-hidden"
                                >
                                    {p.thumbnail_url && (
                                        <Image
                                            src={p.thumbnail_url}
                                            alt={p.name}
                                            width={40}
                                            height={40}
                                            className="object-cover"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => useCompareStore.getState().clearCompare()}
                        >
                            Clear
                        </Button>
                        <Button onClick={() => setDrawerOpen(true)}>
                            Compare Now
                        </Button>
                    </div>
                </div>
            </motion.div>

            <CompareDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
        </>
    );
}
