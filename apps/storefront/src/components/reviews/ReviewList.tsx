"use client";

import { useState } from "react";
import { Star, ThumbsUp, Check, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

function formatDistanceToNow(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
}

interface Review {
    id: string;
    rating: number;
    title: string | null;
    body: string | null;
    pros: string[] | null;
    cons: string[] | null;
    is_verified_purchase: boolean;
    helpful_count: number;
    created_at: string;
    user_id: string | null;
}

interface ReviewCardProps {
    review: Review;
    onHelpful?: (reviewId: string) => void;
    isHelpfulLoading?: boolean;
}

export function ReviewCard({ review, onHelpful, isHelpfulLoading }: ReviewCardProps) {
    const [expanded, setExpanded] = useState(false);
    const maxLength = 300;
    const isLong = (review.body?.length || 0) > maxLength;

    return (
        <div className="bg-muted/10 rounded-2xl p-6 border border-border/30 hover:border-border/50 transition-colors">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    className={cn(
                                        "w-4 h-4",
                                        i < review.rating
                                            ? "text-amber-400 fill-amber-400"
                                            : "text-muted-foreground/20"
                                    )}
                                />
                            ))}
                        </div>
                        {review.is_verified_purchase && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                                <Check className="w-3 h-3" />
                                Verified Purchase
                            </span>
                        )}
                    </div>
                    {review.title && (
                        <h4 className="font-bold text-foreground">{review.title}</h4>
                    )}
                </div>
                <span className="text-xs text-muted-foreground/60">
                    {formatDistanceToNow(new Date(review.created_at))}
                </span>
            </div>

            {/* Body */}
            {review.body && (
                <div className="mb-4">
                    <p className={cn(
                        "text-sm text-muted-foreground leading-relaxed",
                        !expanded && isLong && "line-clamp-3"
                    )}>
                        {review.body}
                    </p>
                    {isLong && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="text-xs font-bold text-primary mt-2 hover:underline"
                        >
                            {expanded ? "Show less" : "Read more"}
                        </button>
                    )}
                </div>
            )}

            {/* Pros & Cons */}
            {(review.pros?.length || review.cons?.length) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {review.pros && review.pros.length > 0 && (
                        <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/10">
                            <h5 className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">
                                Pros
                            </h5>
                            <ul className="space-y-1">
                                {review.pros.map((pro, i) => (
                                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                                        <span className="text-emerald-500 mt-0.5">+</span>
                                        {pro}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {review.cons && review.cons.length > 0 && (
                        <div className="bg-red-500/5 rounded-xl p-4 border border-red-500/10">
                            <h5 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">
                                Cons
                            </h5>
                            <ul className="space-y-1">
                                {review.cons.map((con, i) => (
                                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                                        <span className="text-red-400 mt-0.5">-</span>
                                        {con}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border/20">
                <button
                    onClick={() => onHelpful?.(review.id)}
                    disabled={isHelpfulLoading}
                    className={cn(
                        "flex items-center gap-2 text-sm font-medium transition-colors",
                        "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <ThumbsUp className="w-4 h-4" />
                    Helpful ({review.helpful_count})
                </button>
                <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/30">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

interface ReviewListProps {
    reviews: Review[];
    isLoading?: boolean;
    onHelpful?: (reviewId: string) => void;
    helpfulLoadingId?: string;
}

export function ReviewList({ reviews, isLoading, onHelpful, helpfulLoadingId }: ReviewListProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-muted/10 rounded-2xl p-6 border border-border/30 animate-pulse">
                        <div className="h-4 bg-muted/30 rounded w-1/4 mb-4" />
                        <div className="h-3 bg-muted/30 rounded w-full mb-2" />
                        <div className="h-3 bg-muted/30 rounded w-3/4" />
                    </div>
                ))}
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">No reviews yet</h3>
                <p className="text-sm text-muted-foreground">
                    Be the first to review this product
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {reviews.map((review) => (
                <ReviewCard
                    key={review.id}
                    review={review}
                    onHelpful={onHelpful}
                    isHelpfulLoading={helpfulLoadingId === review.id}
                />
            ))}
        </div>
    );
}
