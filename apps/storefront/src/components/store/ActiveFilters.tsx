"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ActiveFiltersProps {
    filters: {
        brands?: string[];
        minPrice?: number;
        maxPrice?: number;
        ratings?: number[];
        category?: string;
        subcategory?: string;
    };
    onClear: (filterType: string, value?: string) => void;
    onClearAll: () => void;
    formatPrice?: (n: number) => string;
}

export function ActiveFilters({ 
    filters, 
    onClear, 
    onClearAll,
    formatPrice = (n) => `KES ${n.toLocaleString()}`
}: ActiveFiltersProps) {
    const activeCount = 
        (filters.brands?.length || 0) +
        (filters.minPrice || filters.maxPrice ? 1 : 0) +
        (filters.ratings?.length || 0) +
        (filters.category ? 1 : 0) +
        (filters.subcategory ? 1 : 0);

    if (activeCount === 0) return null;

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">
                Active filters:
            </span>
            
            {/* Brand chips */}
            {filters.brands?.map((brand) => (
                <button
                    key={brand}
                    onClick={() => onClear("brand", brand)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold rounded-full hover:bg-primary/20 transition-colors"
                >
                    {brand}
                    <X className="w-3 h-3" />
                </button>
            ))}

            {/* Price range chip */}
            {filters.minPrice !== undefined && filters.maxPrice !== undefined && (
                <button
                    onClick={() => onClear("price")}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[11px] font-bold rounded-full hover:bg-emerald-500/20 transition-colors"
                >
                    {formatPrice(filters.minPrice)} — {formatPrice(filters.maxPrice)}
                    <X className="w-3 h-3" />
                </button>
            )}

            {/* Rating chips */}
            {filters.ratings?.map((rating) => (
                <button
                    key={rating}
                    onClick={() => onClear("rating", String(rating))}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[11px] font-bold rounded-full hover:bg-amber-500/20 transition-colors"
                >
                    {rating}★ & Up
                    <X className="w-3 h-3" />
                </button>
            ))}

            {/* Category chip */}
            {filters.category && (
                <button
                    onClick={() => onClear("category")}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold rounded-full hover:bg-blue-500/20 transition-colors"
                >
                    {filters.category}
                    <X className="w-3 h-3" />
                </button>
            )}

            {/* Subcategory chip */}
            {filters.subcategory && (
                <button
                    onClick={() => onClear("subcategory")}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[11px] font-bold rounded-full hover:bg-purple-500/20 transition-colors"
                >
                    {filters.subcategory}
                    <X className="w-3 h-3" />
                </button>
            )}

            {/* Clear all */}
            <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="h-7 px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
                Clear all ({activeCount})
            </Button>
        </div>
    );
}
