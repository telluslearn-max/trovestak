"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingFilterProps {
    selected: number[];
    onChange: (ratings: number[]) => void;
    counts?: Record<number, number>;
}

const ratings = [5, 4, 3, 2, 1] as const;

export function RatingFilter({ selected, onChange, counts }: RatingFilterProps) {
    const toggleRating = (rating: number) => {
        if (selected.includes(rating)) {
            onChange(selected.filter(r => r !== rating));
        } else {
            onChange([...selected, rating]);
        }
    };

    return (
        <div className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-3">
                Customer Rating
            </div>
            {ratings.map((rating) => {
                const isSelected = selected.includes(rating);
                const count = counts?.[rating] ?? 0;
                
                return (
                    <button
                        key={rating}
                        onClick={() => toggleRating(rating)}
                        className={cn(
                            "w-full flex items-center justify-between py-2 px-3 rounded-xl transition-all",
                            isSelected 
                                ? "bg-primary/10 border border-primary/30" 
                                : "bg-muted/20 border border-transparent hover:bg-muted/30"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <div className="flex">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        className={cn(
                                            "w-3.5 h-3.5",
                                            i < rating 
                                                ? "text-amber-400 fill-amber-400" 
                                                : "text-muted-foreground/20"
                                        )}
                                    />
                                ))}
                            </div>
                            <span className="text-xs font-bold text-muted-foreground">
                                & Up
                            </span>
                        </div>
                        {count > 0 && (
                            <span className={cn(
                                "text-[10px] font-bold",
                                isSelected ? "text-primary" : "text-muted-foreground/50"
                            )}>
                                ({count})
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
