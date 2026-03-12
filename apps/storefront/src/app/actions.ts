"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

/**
 * Newsletter Subscription
 */
export async function subscribeToNewsletter(email: string) {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
        .from("newsletter_subscribers")
        .insert([{ email }]);

    if (error) {
        console.error("Newsletter subscription error:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Fetch Upsell Recommendations
 */
export async function getUpsellRecommendations(cartProductIds: string[]) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    try {
        // Try edge function first
        const { data, error } = await supabase.functions.invoke('mesh-upsell', {
            body: { userId: user?.id, cartProductIds }
        });

        if (error || !data?.recommendations) {
            // Fallback: fetch popular products directly
            const { data: fallback } = await supabase
                .from('products')
                .select('id, name, slug, thumbnail_url, product_variants(id, price_kes, stock_quantity), categories(name, slug)')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(3);

            return {
                recommendations: fallback?.map((p: any) => ({
                    ...p,
                    recommendation_reason: 'popular',
                    match_strength: 0.5
                })) || []
            };
        }

        return { recommendations: data.recommendations };
    } catch (err) {
        console.error("Error fetching recommendations:", err);
        return { recommendations: [] };
    }
}

/**
 * Fetch Admin Notifications (Pending Orders)
 */
export async function getAdminNotifications() {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("orders")
        .select("id, total_amount, created_at, status")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching admin notifications:", error);
        return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: data || [] };
}
