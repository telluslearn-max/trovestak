"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

/**
 * Submit a product review
 */
export async function submitReviewAction(
    productId: string,
    review: { rating: number; title: string; body: string; pros: string[]; cons: string[] }
) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Authentication required" };

    const { error } = await supabase
        .from('product_reviews')
        .insert([{
            product_id: productId,
            user_id: user.id,
            rating: review.rating,
            title: review.title,
            body: review.body,
            pros: review.pros,
            cons: review.cons,
            is_approved: false // Default to unapproved for moderation
        }]);

    if (error) {
        console.error('Review submission error:', error);
        return { error: error.message };
    }

    revalidatePath(`/products/${productId}`); // We might need the slug here, but ID works for internal cache
    return { success: true };
}

/**
 * Mark a review as helpful
 */
export async function markReviewHelpfulAction(reviewId: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Authentication required" };

    const { error } = await supabase
        .from('review_helpful')
        .upsert([{
            review_id: reviewId,
            user_id: user.id
        }], { onConflict: 'review_id,user_id' });

    if (error) {
        console.error('Review helpful error:', error);
        return { error: error.message };
    }

    return { success: true };
}
