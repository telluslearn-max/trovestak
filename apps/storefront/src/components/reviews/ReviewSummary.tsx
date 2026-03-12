"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewSummaryProps {
    averageRating: number;
    reviewCount: number;
    ratingDistribution: Record<number, number>;
}

export function ReviewSummary({ averageRating, reviewCount, ratingDistribution }: ReviewSummaryProps) {
    const maxCount = Math.max(...Object.values(ratingDistribution), 1);

    return (
        <div className="bg-muted/20 rounded-[2rem] p-8 border border-border/30">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Average Rating */}
                <div className="flex flex-col items-center justify-center md:w-48 flex-shrink-0">
                    <div className="text-6xl font-black tracking-tighter text-foreground">
                        {averageRating.toFixed(1)}
                    </div>
                    <div className="flex gap-0.5 mt-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                                key={i}
                                className={cn(
                                    "w-5 h-5",
                                    i < Math.round(averageRating)
                                        ? "text-amber-400 fill-amber-400"
                                        : "text-muted-foreground/20"
                                )}
                            />
                        ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 font-medium">
                        Based on {reviewCount.toLocaleString()} review{reviewCount !== 1 ? "s" : ""}
                    </p>
                </div>

                {/* Rating Distribution */}
                <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => {
                        const count = ratingDistribution[rating] || 0;
                        const percentage = reviewCount > 0 ? (count / reviewCount) * 100 : 0;

                        return (
                            <button
                                key={rating}
                                className="w-full flex items-center gap-3 group"
                            >
                                <span className="text-sm font-medium text-muted-foreground w-6 text-right">
                                    {rating}
                                </span>
                                <Star className="w-4 h-4 text-muted-foreground/50" />
                                <div className="flex-1 h-3 bg-muted/30 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-amber-400 rounded-full transition-all group-hover:bg-amber-300"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground/60 w-10 text-right">
                                    {count > 0 ? count : "-"}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Write Review CTA */}
            <div className="mt-8 pt-6 border-t border-border/30 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Share your experience with this product
                </p>
                <button className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors">
                    Write a Review
                </button>
            </div>
        </div>
    );
}
