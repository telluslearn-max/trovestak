"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PriceRangeSlider } from "@/components/store/PriceRangeSlider";
import { RatingFilter } from "@/components/store/RatingFilter";
import { BrandFilter } from "@/components/store/BrandFilter";
import { ActiveFilters } from "@/components/store/ActiveFilters";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

interface StoreFiltersProps {
    brands: string[];
    currentBrand?: string;
    currentSort?: string;
    category?: string;
    subcategory?: string;
    minPrice?: number;
    maxPrice?: number;
    priceRange?: [number, number];
    ratings?: number[];
    brandCounts?: Record<string, number>;
    ratingCounts?: Record<number, number>;
    totalResults?: number;
}

export function StoreFilters({
    brands,
    currentBrand,
    currentSort,
    category,
    subcategory,
    minPrice = 0,
    maxPrice = 500000,
    priceRange = [0, 500000],
    ratings = [],
    brandCounts,
    ratingCounts,
    totalResults,
}: StoreFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    const [selectedBrands, setSelectedBrands] = useState<string[]>(
        currentBrand ? [currentBrand] : []
    );
    const [selectedPrice, setSelectedPrice] = useState<[number, number]>(priceRange);
    const [selectedRatings, setSelectedRatings] = useState<number[]>(ratings);

    const updateQuery = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === "") {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });
        router.push(`/store?${params.toString()}`);
    };

    const applyFilters = () => {
        const params = new URLSearchParams(searchParams.toString());

        // Brand
        if (selectedBrands.length > 0) {
            params.set("brand", selectedBrands.join(","));
        } else {
            params.delete("brand");
        }

        // Price
        if (selectedPrice[0] > minPrice || selectedPrice[1] < maxPrice) {
            params.set("minPrice", String(selectedPrice[0]));
            params.set("maxPrice", String(selectedPrice[1]));
        } else {
            params.delete("minPrice");
            params.delete("maxPrice");
        }

        // Ratings
        if (selectedRatings.length > 0) {
            params.set("rating", selectedRatings.join(","));
        } else {
            params.delete("rating");
        }

        router.push(`/store?${params.toString()}`);
        setMobileFiltersOpen(false);
    };

    const clearFilter = (type: string, value?: string) => {
        const params = new URLSearchParams(searchParams.toString());

        switch (type) {
            case "brand":
                const currentBrands = params.get("brand")?.split(",").filter(Boolean) || [];
                const newBrands = currentBrands.filter(b => b !== value);
                if (newBrands.length > 0) {
                    params.set("brand", newBrands.join(","));
                    setSelectedBrands(newBrands);
                } else {
                    params.delete("brand");
                    setSelectedBrands([]);
                }
                break;
            case "price":
                params.delete("minPrice");
                params.delete("maxPrice");
                setSelectedPrice([minPrice, maxPrice]);
                break;
            case "rating":
                const currentRatings = params.get("rating")?.split(",").map(Number).filter(Boolean) || [];
                const newRatings = currentRatings.filter(r => r !== Number(value));
                if (newRatings.length > 0) {
                    params.set("rating", newRatings.join(","));
                    setSelectedRatings(newRatings);
                } else {
                    params.delete("rating");
                    setSelectedRatings([]);
                }
                break;
            case "category":
                params.delete("category");
                params.delete("subcategory");
                break;
            case "subcategory":
                params.delete("subcategory");
                break;
        }

        router.push(`/store?${params.toString()}`);
    };

    const clearAllFilters = () => {
        setSelectedBrands([]);
        setSelectedPrice([minPrice, maxPrice]);
        setSelectedRatings([]);
        
        const params = new URLSearchParams();
        if (currentSort) params.set("sort", currentSort);
        router.push(`/store?${params.toString()}`);
    };

    const FilterContent = () => (
        <div className="space-y-8">
            {/* Brand Filter */}
            <BrandFilter
                brands={brands}
                selected={selectedBrands}
                onChange={setSelectedBrands}
                counts={brandCounts}
            />

            {/* Price Range */}
            <div className="space-y-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Price Range
                </div>
                <PriceRangeSlider
                    min={minPrice}
                    max={maxPrice}
                    value={selectedPrice}
                    onChange={setSelectedPrice}
                />
            </div>

            {/* Rating Filter */}
            <RatingFilter
                selected={selectedRatings}
                onChange={setSelectedRatings}
                counts={ratingCounts}
            />

            {/* Apply Button (Mobile) */}
            <div className="md:hidden pt-4 border-t border-border/30">
                <Button
                    onClick={applyFilters}
                    className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl font-bold"
                >
                    Apply Filters
                </Button>
            </div>
        </div>
    );

    return (
        <div className="mb-8">
            {/* Header: Results count + Sort + Mobile filter button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                        <span className="font-bold text-foreground">{totalResults}</span> products
                    </p>

                    {/* Mobile Filter Button */}
                    <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="md:hidden h-10 px-4 gap-2">
                                <SlidersHorizontal className="w-4 h-4" />
                                Filters
                                {(selectedBrands.length + selectedRatings.length) > 0 && (
                                    <span className="w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {selectedBrands.length + selectedRatings.length}
                                    </span>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-80 overflow-y-auto">
                            <SheetHeader>
                                <SheetTitle className="text-left">Filters</SheetTitle>
                            </SheetHeader>
                            <div className="mt-6">
                                <FilterContent />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Sort by
                    </span>
                    <Select
                        value={currentSort || "newest"}
                        onValueChange={(value) => updateQuery({ sort: value })}
                    >
                        <SelectTrigger className="w-48 h-10 bg-muted/30 border-border/50 rounded-xl">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest</SelectItem>
                            <SelectItem value="price_asc">Price: Low to High</SelectItem>
                            <SelectItem value="price_desc">Price: High to Low</SelectItem>
                            <SelectItem value="rating">Top Rated</SelectItem>
                            <SelectItem value="popular">Most Popular</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Active Filters */}
            <ActiveFilters
                filters={{
                    brands: selectedBrands,
                    minPrice: selectedPrice[0] > minPrice ? selectedPrice[0] : undefined,
                    maxPrice: selectedPrice[1] < maxPrice ? selectedPrice[1] : undefined,
                    ratings: selectedRatings,
                    category,
                    subcategory,
                }}
                onClear={clearFilter}
                onClearAll={clearAllFilters}
            />

            {/* Desktop Filters Sidebar - to be placed in grid layout by parent */}
            <div className="hidden md:block mt-8">
                <FilterContent />
            </div>
        </div>
    );
}
