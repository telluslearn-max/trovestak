"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Searches for products based on a search term
 */
export async function searchProductsAction(searchTerm: string) {
    if (searchTerm.length < 2) return { products: [] };

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, description, thumbnail_url, brand_type, nav_category, product_variants(price_kes)")
        .eq("is_active", true)
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,brand_type.ilike.%${searchTerm}%`)
        .limit(20);

    if (error) {
        console.error("Search error:", error);
        return { products: [], error: error.message };
    }

    return { products: data || [] };
}
