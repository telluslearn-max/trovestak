"use client";

import { useState, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface BrandFilterProps {
    brands: string[];
    selected: string[];
    onChange: (brands: string[]) => void;
    counts?: Record<string, number>;
}

export function BrandFilter({ brands, selected, onChange, counts }: BrandFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filteredBrands = brands.filter(brand =>
        brand.toLowerCase().includes(search.toLowerCase())
    );

    const toggleBrand = (brand: string) => {
        if (selected.includes(brand)) {
            onChange(selected.filter(b => b !== brand));
        } else {
            onChange([...selected, brand]);
        }
    };

    const clearAll = () => {
        onChange([]);
    };

    useEffect(() => {
        if (!isOpen) {
            setSearch("");
        }
    }, [isOpen]);

    return (
        <div className="space-y-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                Brand
            </div>
            
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full justify-between h-11 bg-muted/20 border-border/50 hover:bg-muted/30 font-medium"
                    >
                        <span className={cn(
                            "truncate",
                            selected.length === 0 ? "text-muted-foreground" : "text-foreground"
                        )}>
                            {selected.length === 0 
                                ? "All Brands" 
                                : selected.length === 1 
                                    ? selected[0]
                                    : `${selected.length} selected`
                            }
                        </span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground ml-2" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                    className="w-64 max-h-80 overflow-hidden p-0"
                    align="start"
                >
                    {/* Search */}
                    <div className="p-2 border-b border-border/30">
                        <input
                            type="text"
                            placeholder="Search brands..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-9 px-3 text-sm bg-muted/30 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    
                    {/* Selected count */}
                    {selected.length > 0 && (
                        <div className="px-3 py-2 border-b border-border/30 flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">
                                {selected.length} selected
                            </span>
                            <button
                                onClick={clearAll}
                                className="text-xs font-bold text-primary hover:underline"
                            >
                                Clear
                            </button>
                        </div>
                    )}
                    
                    {/* Brand list */}
                    <div className="overflow-y-auto max-h-48">
                        {filteredBrands.map((brand) => {
                            const isSelected = selected.includes(brand);
                            const count = counts?.[brand] ?? 0;
                            
                            return (
                                <button
                                    key={brand}
                                    onClick={() => toggleBrand(brand)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 transition-colors",
                                        isSelected && "bg-primary/5"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                            isSelected 
                                                ? "bg-primary border-primary" 
                                                : "border-muted-foreground/30"
                                        )}>
                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className="text-sm font-medium text-foreground">
                                            {brand}
                                        </span>
                                    </div>
                                    {count > 0 && (
                                        <span className="text-[10px] font-bold text-muted-foreground/50">
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                        
                        {filteredBrands.length === 0 && (
                            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                                No brands found
                            </div>
                        )}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Selected brand chips */}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {selected.slice(0, 4).map((brand) => (
                        <span
                            key={brand}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-lg"
                        >
                            {brand}
                            <button
                                onClick={() => toggleBrand(brand)}
                                className="hover:text-primary/70"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    {selected.length > 4 && (
                        <span className="px-2 py-1 bg-muted/30 text-muted-foreground text-[10px] font-bold rounded-lg">
                            +{selected.length - 4} more
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
