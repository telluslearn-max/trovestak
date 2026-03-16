"use client";
import { useConciergeTracker } from "@/hooks/useConciergeTracker";

/**
 * Lightweight client component to track category views/scrolls.
 * Rendered within server components to bridge the behavioral tracking.
 */
export function CategoryTracker({ categoryId, productId }: { categoryId?: string; productId?: string }) {
    useConciergeTracker({ categoryId, productId });
    return null;
}
