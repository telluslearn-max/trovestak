"use client";
import { useConciergeTracker } from "@/hooks/useConciergeTracker";

/**
 * Lightweight client component to track category views/scrolls.
 * Rendered within server components to bridge the behavioral tracking.
 */
export function CategoryTracker({ categoryId }: { categoryId?: string }) {
    useConciergeTracker({ categoryId });
    return null;
}
