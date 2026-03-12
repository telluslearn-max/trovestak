"use client";

import { Star, ShoppingCart, Heart, Zap } from "lucide-react";
import { formatKES } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface ProductPreviewCardProps {
    name: string;
    description: string;
    price: number;
    image: string;
    category?: string;
}

export function ProductPreviewCard({ name, description, price, image, category }: ProductPreviewCardProps) {
    return (
        <div className="w-[320px] bg-white dark:bg-[#0a0a0a] rounded-[2rem] overflow-hidden shadow-2xl border border-black/5 dark:border-white/5 group">
            <div className="relative aspect-[4/5] bg-muted/20 overflow-hidden">
                {image ? (
                    <img src={image} alt={name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/20">No Hero Asset</div>
                )}
                <div className="absolute top-4 left-4">
                    <div className="px-3 py-1 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-md text-[8px] font-black uppercase tracking-widest text-foreground shadow-sm">
                        {category || "Uncategorized"}
                    </div>
                </div>
                <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors cursor-pointer shadow-sm">
                    <Heart className="w-3.5 h-3.5" />
                </div>
            </div>

            <div className="p-6 space-y-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Star key={i} className="w-2 h-2 fill-amber-400 text-amber-400" />
                        ))}
                        <span className="text-[8px] font-black text-muted-foreground/60 ml-1">4.9 (128)</span>
                    </div>
                    <h3 className="text-xl font-black text-foreground tracking-tight line-clamp-1">{name || "Unnamed Product"}</h3>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Price</span>
                        <span className="text-2xl font-black text-primary tracking-tighter leadning-none">{formatKES(price)}</span>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <ShoppingCart className="w-4 h-4" />
                    </div>
                </div>

                <div className="pt-4 border-t border-black/5 dark:border-white/5">
                    <button className="w-full h-11 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all">
                        <Zap className="w-3 h-3 fill-current" />
                        Buy Now
                    </button>
                </div>
            </div>
        </div>
    );
}
