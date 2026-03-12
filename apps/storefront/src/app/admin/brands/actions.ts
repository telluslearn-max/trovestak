"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { ensureAdmin } from "@/lib/admin/guard";

/**
 * Fetches details for a single brand and all its products.
 */
export async function getBrandDetail(slug: string) {
    await ensureAdmin("support");
    const supabase = await createSupabaseServerClient();

    const [brandRes, brandsListRes] = await Promise.all([
        supabase.from("brands").select("*").eq("slug", slug).single(),
        supabase.from("brands").select("id, name, slug").order("name")
    ]);

    if (brandRes.error || !brandRes.data) {
        throw new Error(`Brand not found: ${slug}`);
    }

    const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, name, slug, thumbnail_url, is_active, sell_price, stock_quantity")
        .eq("brand_slug", slug)
        .order("name");

    if (productsError) throw new Error(productsError.message);

    return {
        brand: brandRes.data,
        products: products || [],
        brandsList: brandsListRes.data || []
    };
}

/**
 * Bulk updates the brand_slug for a set of products.
 */
export async function bulkUpdateProductBrand(productIds: string[], brandSlug: string) {
    await ensureAdmin("editor");
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
        .from("products")
        .update({ brand_slug: brandSlug, updated_at: new Date().toISOString() })
        .in("id", productIds);

    if (error) throw new Error(error.message);

    revalidatePath("/admin/brands");
    return { success: true };
}
