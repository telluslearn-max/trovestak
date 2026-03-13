"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { logAdminActivity } from "@/lib/admin/activity";

export async function updateProduct(id: string, productData: any) {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
        .from("products")
        .update({
            name: productData.name,
            description: productData.description,
            seo_title: productData.seo_title,
            seo_description: productData.seo_description,
            is_active: productData.is_active,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (error) throw new Error(error.message);

    await logAdminActivity({
        action: "UPDATE_PRODUCT",
        resource: "products",
        resourceId: id,
        metadata: { name: productData.name },
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
    revalidatePath(`/products/${productData.slug || id}`, "page");

    return { success: true };
}

export async function updateVariantPrice(formData: FormData) {
    const supabase = await createSupabaseServerClient();
    const variantId = formData.get("variant_id") as string;
    const productId = formData.get("product_id") as string;
    const priceRaw = formData.get("price_kes") as string;

    if (!variantId || !productId) return;

    let price_kes = null;
    if (priceRaw && priceRaw.trim() !== "") {
        price_kes = Math.round(parseFloat(priceRaw) * 100);
    }

    const { error } = await supabase
        .from("product_variants")
        .update({
            price_kes,
            updated_at: new Date().toISOString()
        })
        .eq("id", variantId);

    if (error) throw new Error(error.message);

    await logAdminActivity({
        action: "UPDATE_VARIANT_PRICE",
        resource: "product_variants",
        resourceId: variantId,
        metadata: { productId, price_kes },
    });

    revalidatePath(`/admin/products/${productId}`);
}

export async function updateProductGallery(id: string, galleryUrls: string[]) {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
        .from("products")
        .update({
            gallery_urls: galleryUrls,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (error) throw new Error(error.message);

    await logAdminActivity({
        action: "UPDATE_PRODUCT",
        resource: "products",
        resourceId: id,
        metadata: { galleryUpdated: true },
    });

    revalidatePath(`/admin/products/${id}`);
    return { success: true };
}

export async function updateVariantCostPrice(variantId: string, productId: string, costPrice: number) {
    const supabase = await createSupabaseServerClient();

    const costPriceCents = Math.round(costPrice * 100);

    const { data: existingOffer } = await supabase
        .from("supplier_product_offer")
        .select("id")
        .eq("variant_id", variantId)
        .maybeSingle();

    if (existingOffer) {
        const { error } = await supabase
            .from("supplier_product_offer")
            .update({ cost_price: costPriceCents, last_updated: new Date().toISOString() })
            .eq("id", existingOffer.id);
        
        if (error) throw new Error(error.message);
    } else {
        const { error } = await supabase
            .from("supplier_product_offer")
            .insert({ 
                variant_id: variantId, 
                cost_price: costPriceCents,
                currency: 'KES'
            });
        
        if (error) throw new Error(error.message);
    }

    await logAdminActivity({
        action: "UPDATE_VARIANT_COST",
        resource: "product_variants",
        resourceId: variantId,
        metadata: { productId, costPrice: costPriceCents },
    });

    revalidatePath(`/admin/products/${productId}`);
    return { success: true };
}

export async function updateRelatedProducts(productId: string, relatedProductIds: string[]) {
    const supabase = await createSupabaseServerClient();

    await supabase
        .from("product_relation")
        .delete()
        .eq("from_product_id", productId);

    if (relatedProductIds.length > 0) {
        const relations = relatedProductIds.map(toProductId => ({
            from_product_id: productId,
            to_product_id: toProductId,
            relation_type: "compatible_with",
            strength: 1.0
        }));

        const { error } = await supabase
            .from("product_relation")
            .insert(relations);

        if (error) throw new Error(error.message);
    }

    await logAdminActivity({
        action: "UPDATE_PRODUCT_RELATIONS",
        resource: "products",
        resourceId: productId,
        metadata: { relatedCount: relatedProductIds.length },
    });

    revalidatePath(`/admin/products/${productId}`);
    return { success: true };
}

export async function searchProducts(query: string, excludeId: string) {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
        .from("products")
        .select("id, name, slug")
        .ilike("name", `%${query}%`)
        .neq("id", excludeId)
        .limit(10);
    
    if (error) return { data: [], error: error.message };
    return { data: data || [] };
}
