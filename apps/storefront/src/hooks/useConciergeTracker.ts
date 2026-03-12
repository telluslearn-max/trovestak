"use client";
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useSessionId } from "./useSessionId";

/**
 * Hook to track user behavioral signals for the Shopping Concierge.
 * It builds a "Silent Taste Profile" in Supabase based on views and scrolling.
 */
export function useConciergeTracker({
    productId,
    categoryId
}: {
    productId?: string;
    categoryId?: string;
}) {
    const sessionId = useSessionId();
    const hasTrackedView = useRef(false);
    const hasTrackedDeepScroll = useRef(false);

    // 1. Track Product/Category View
    useEffect(() => {
        if (!sessionId || hasTrackedView.current) return;

        const trackView = async () => {
            await supabase.from("user_events").insert({
                session_id: sessionId,
                event_type: "view",
                product_id: productId,
                category_id: categoryId
            });
            hasTrackedView.current = true;
        };

        trackView();
    }, [sessionId, productId, categoryId]);

    // 2. Track Deep Scroll (Signal of high interest)
    useEffect(() => {
        if (!sessionId) return;

        const handleScroll = () => {
            if (hasTrackedDeepScroll.current) return;

            const scrollDepth = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
            if (scrollDepth > 0.8) {
                 supabase.from("user_events").insert({
                    session_id: sessionId,
                    event_type: "scroll",
                    product_id: productId,
                    category_id: categoryId,
                    metadata: { depth: "deep", path: window.location.pathname }
                });
                hasTrackedDeepScroll.current = true;
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [sessionId, productId, categoryId]);
}
