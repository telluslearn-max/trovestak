"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StoreFiltersProps {
    brands: string[];
    currentBrand?: string;
    currentSort?: string;
}

export function StoreFilters({ brands, currentBrand, currentSort }: StoreFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const updateQuery = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null) {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });
        router.push(`/store?${params.toString()}`);
    };

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
            {/* Brand Filter */}
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mr-2">Filter By Brand</span>
                <div className="flex flex-wrap gap-2.5">
                    <button
                        onClick={() => updateQuery({ brand: null })}
                        className={cn(
                            "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 border",
                            !currentBrand
                                ? "bg-foreground text-background border-foreground shadow-xl shadow-foreground/10 scale-105"
                                : "bg-muted/30 text-muted-foreground border-transparent hover:border-muted-foreground/30 hover:bg-muted/50"
                        )}
                    >
                        All Brands
                    </button>
                    {brands.map((brand) => (
                        <button
                            key={brand}
                            onClick={() => updateQuery({ brand })}
                            className={cn(
                                "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 border",
                                currentBrand === brand
                                    ? "bg-foreground text-background border-foreground shadow-xl shadow-foreground/10 scale-105"
                                    : "bg-muted/30 text-muted-foreground border-transparent hover:border-muted-foreground/30 hover:bg-muted/50"
                            )}
                        >
                            {brand}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sort Selection */}
            <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Sort By</span>
                <Select
                    value={currentSort || "newest"}
                    onValueChange={(value) => updateQuery({ sort: value })}
                >
                    <SelectTrigger className="w-[200px] h-11 rounded-2xl bg-muted/40 border border-apple-border dark:border-apple-border-dark focus:ring-primary/20 font-bold text-[11px] uppercase tracking-wider px-5 shadow-sm transition-all hover:bg-muted/60">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-apple-border dark:border-apple-border-dark bg-white/90 dark:bg-apple-dark/90 backdrop-blur-xl p-1">
                        <SelectItem value="newest" className="font-bold text-[11px] uppercase tracking-wider rounded-xl py-3 cursor-pointer">Newest Arrivals</SelectItem>
                        <SelectItem value="price_asc" className="font-bold text-[11px] uppercase tracking-wider rounded-xl py-3 cursor-pointer">Price: Low to High</SelectItem>
                        <SelectItem value="price_desc" className="font-bold text-[11px] uppercase tracking-wider rounded-xl py-3 cursor-pointer">Price: High to Low</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
