"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

/**
 * Remove an item from the user's wishlist
 */
export async function removeFromWishlistAction(productId: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Authentication required" };

    const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

    if (error) {
        console.error('Wishlist remove error:', error);
        return { error: error.message };
    }

    revalidatePath("/wishlist");
    return { success: true };
}

/**
 * Sync wishlist items for the authenticated user
 */
export async function getWishlistItemsAction() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { items: [] };

    const { data, error } = await supabase
        .from('wishlist_items')
        .select(`
            id,
            product_id,
            variant_id,
            created_at,
            products (
                name,
                slug,
                thumbnail_url,
                product_variants!inner (price_kes)
            )
        `)
        .eq('user_id', user.id);

    if (error) {
        console.error('Wishlist sync error:', error);
        return { items: [], error: error.message };
    }

    const items = data.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        title: item.products?.name || '',
        unit_price: item.products?.product_variants?.[0]?.price_kes
            ? Math.round(item.products.product_variants[0].price_kes / 100)
            : 0,
        thumbnail: item.products?.thumbnail_url,
        slug: item.products?.slug || '',
        added_at: item.created_at,
    }));

    return { items };
}
