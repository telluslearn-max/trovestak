"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { ensureAdmin } from "@/lib/admin/guard";
import { logAdminActivity } from "@/lib/admin/activity";

// Phase 6 Refactoring Tasks:
// - [x] Refactor `src/app/category/[slug]/page.tsx` (REFACTORED)
// - [x] Refactor `src/app/category/[slug]/[subcategory]/page.tsx` (REFACTORED)
// - [x] Refactor `src/app/category/[slug]/[subcategory]/[brand]/page.tsx` (REFACTORED)
// - [x] Refactor Auth pages (Login, Signup, Sign-In, Sign-Up) (REFACTORED)
/**
 * Bulk updates the category for a set of products.
 */
export async function bulkUpdateCategory(productIds: string[], categoryId: string) {
    await ensureAdmin("editor");
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
        .from("products")
        .update({ category_id: categoryId, updated_at: new Date().toISOString() })
        .in("id", productIds);

    if (error) throw new Error(error.message);

    await logAdminActivity({
        action: "BULK_UPDATE_CATEGORY",
        resource: "products",
        resourceId: "multiple",
        metadata: { productIds, categoryId },
    });

    revalidatePath("/admin/products");
    return { success: true };
}

/**
 * Bulk updates prices for all variants of selected products.
 */
// - [x] Refactor global components (Footer, MeshUpsellWidget, NotificationBell) (REFACTORED)
// - [x] Refactor remaining global components (CompareBar, PriceRangeSlider) (REFACTORED)
export async function bulkUpdatePrices(
    productIds: string[],
    type: "percentage" | "fixed",
    value: number,
    direction: "increase" | "decrease"
) {
    await ensureAdmin("editor");
    const supabase = await createSupabaseServerClient();

    // 1. Fetch all variants for these products
    const { data: variants, error: fetchError } = await supabase
        .from("product_variants")
        .select("id, price_kes")
        .in("product_id", productIds);

    if (fetchError) throw new Error(fetchError.message);
    if (!variants || variants.length === 0) return { success: true, updated: 0 };

    // 2. Prepare updates
    const updates = variants.map(v => {
        let newPrice = v.price_kes || 0;

        if (type === "percentage") {
            const adjustment = Math.round(newPrice * (value / 100));
            newPrice = direction === "increase" ? newPrice + adjustment : newPrice - adjustment;
        } else {
            // value is expected in KES, convert to cents
            const adjustmentCents = value * 100;
            newPrice = direction === "increase" ? newPrice + adjustmentCents : newPrice - adjustmentCents;
        }

        return {
            id: v.id,
            price_kes: Math.max(0, newPrice),
            updated_at: new Date().toISOString()
        };
    });

    // 3. Batch update variants
    const { error: updateError } = await supabase
        .from("product_variants")
        .upsert(updates);

    if (updateError) throw new Error(updateError.message);

    await logAdminActivity({
        action: "BULK_UPDATE_PRICES",
        resource: "products",
        resourceId: "multiple",
        metadata: { type, value, direction, productCount: productIds.length },
    });

    revalidatePath("/admin/products");
    return { success: true, updated: updates.length };
}

/**
 * Bulk deletes products and their associated variants (cascading).
 */
export async function bulkDeleteProducts(productIds: string[]) {
    await ensureAdmin("manager");
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
        .from("products")
        .delete()
        .in("id", productIds);

    if (error) throw new Error(error.message);

    await logAdminActivity({
        action: "BULK_DELETE_PRODUCTS",
        resource: "products",
        resourceId: "multiple",
        metadata: { productIds },
    });

    revalidatePath("/admin/products");
    return { success: true };
}

/**
 * Bulk toggles the active status of products.
 */
export async function bulkToggleStatus(productIds: string[], active: boolean) {
    await ensureAdmin("editor");
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
        .from("products")
        .update({ is_active: active, updated_at: new Date().toISOString() })
        .in("id", productIds);

    if (error) throw new Error(error.message);

    await logAdminActivity({
        action: "BULK_TOGGLE_STATUS",
        resource: "products",
        resourceId: "multiple",
        metadata: { productIds, active },
    });

    revalidatePath("/admin/products");
    return { success: true };
}

/**
 * Bulk Upsert products from CSV data.
 */
export async function bulkUpsertProducts(productsData: any[]) {
    await ensureAdmin("editor");
    const supabase = await createSupabaseServerClient();

    // This expects cleaned data from the client mapping layer
    const { data, error } = await supabase
        .from("products")
        .upsert(productsData.map(p => ({
            ...p,
            updated_at: new Date().toISOString()
        })))
        .select();

    if (error) throw new Error(error.message);

    await logAdminActivity({
        action: "BULK_IMPORT_PRODUCTS",
        resource: "products",
        resourceId: "multiple",
        metadata: { count: data?.length || 0 },
    });

    revalidatePath("/admin/products");
    return { success: true, count: data?.length || 0 };
}

export async function updateProductPrice(variantId: string, priceKes: number) {
    await ensureAdmin("editor");
    const supabase = await createSupabaseServerClient();

    const priceCents = Math.round(priceKes * 100);

    const { error } = await supabase
        .from("product_variants")
        .update({ price_kes: priceCents, updated_at: new Date().toISOString() })
        .eq("id", variantId);

    if (error) throw new Error(error.message);

    await logAdminActivity({
        action: "UPDATE_VARIANT_PRICE",
        resource: "product_variants",
        resourceId: variantId,
        metadata: { price: priceCents },
    });

    revalidatePath("/admin/products");
    return { success: true };
}

/**
 * Fetches the full product list for the admin dashboard.
 */
export async function getProductsAdminList() {
    await ensureAdmin("support");
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    const active = data?.filter(p => p.is_active).length || 0;
    const oos = data?.filter(p => (p.stock_quantity || 0) === 0).length || 0;

    return {
        products: data || [],
        stats: {
            total: data?.length || 0,
            active,
            outOfStock: oos,
        }
    };
}

/**
 * Deletes a single product.
 */
export async function deleteProduct(id: string) {
    await ensureAdmin("manager");
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

    if (error) throw new Error(error.message);

    await logAdminActivity({
        action: "DELETE_PRODUCT",
        resource: "products",
        resourceId: id,
    });

    revalidatePath("/admin/products");
    return { success: true };
}

/**
 * Fetches a single product by ID for the admin editor.
 */
export async function getProductById(id: string) {
    await ensureAdmin("support");
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

    if (error) throw new Error(error.message);

    // Fetch primary category
    const { data: catData } = await supabase
        .from("product_categories")
        .select("category_id")
        .eq("product_id", id)
        .eq("is_primary", true)
        .single();

    return {
        product: data,
        primaryCategoryId: catData?.category_id || null
    };
}

/**
 * Upserts a product (Create or Update).
 */
export async function upsertProduct(id: string | null, payload: any, primaryCategoryId?: string) {
    await ensureAdmin("editor");
    const supabase = await createSupabaseServerClient();

    let result;
    if (id) {
        // Update
        result = await supabase
            .from("products")
            .update({ ...payload, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single();
    } else {
        // Insert
        result = await supabase
            .from("products")
            .insert({ ...payload, is_active: payload.is_active ?? true })
            .select()
            .single();
    }

    if (result.error) throw new Error(result.error.message);

    const savedProduct = result.data;

    // Handle primary category
    if (primaryCategoryId) {
        await supabase
            .from("product_categories")
            .delete()
            .eq("product_id", savedProduct.id);

        await supabase
            .from("product_categories")
            .insert({
                product_id: savedProduct.id,
                category_id: primaryCategoryId,
                is_primary: true,
            });
    }

    await logAdminActivity({
        action: id ? "UPDATE_PRODUCT" : "CREATE_PRODUCT",
        resource: "products",
        resourceId: savedProduct.id,
        metadata: { name: savedProduct.name },
    });

    revalidatePath("/admin/products");
    if (id) revalidatePath(`/admin/products/${id}`);

    return { success: true, product: savedProduct };
}


/**
 * Searches products for admin use (e.g., linking products).
 */
export async function searchProductsAdmin(query: string) {
    await ensureAdmin("support");
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("products")
        .select("id, name, thumbnail_url, sell_price, sku")
        .ilike("name", `%${query}%`)
        .limit(10);

    if (error) throw new Error(error.message);
    return data || [];
}

/**
 * ATTRIBUTE MANAGEMENT ACTIONS
 */

export async function getAttributeGroups() {
    await ensureAdmin("support");
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("product_attribute_groups")
        .select(`
            *,
            terms:product_attribute_terms(*)
        `)
        .order("position", { ascending: true })
        .order("name");

    if (error) throw new Error(error.message);
    return data || [];
}

export async function upsertAttributeGroup(data: any, id?: string) {
    await ensureAdmin("editor");
    const supabase = await createSupabaseServerClient();

    if (id) {
        const { error } = await supabase
            .from("product_attribute_groups")
            .update(data)
            .eq("id", id);
        if (error) throw new Error(error.message);
        await logAdminActivity({ action: "UPDATE_ATTRIBUTE_GROUP", resource: "product_attribute_groups", resourceId: id, metadata: { data } });
    } else {
        const { data: newGroup, error } = await supabase
            .from("product_attribute_groups")
            .insert(data)
            .select()
            .single();
        if (error) throw new Error(error.message);
        await logAdminActivity({ action: "CREATE_ATTRIBUTE_GROUP", resource: "product_attribute_groups", resourceId: newGroup.id, metadata: { data } });
        return newGroup;
    }
}

export async function deleteAttributeGroup(id: string) {
    await ensureAdmin("manager");
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
        .from("product_attribute_groups")
        .delete()
        .eq("id", id);

    if (error) throw new Error(error.message);
    await logAdminActivity({ action: "DELETE_ATTRIBUTE_GROUP", resource: "product_attribute_groups", resourceId: id });
}

export async function upsertAttributeTerm(data: any, id?: string) {
    await ensureAdmin("editor");
    const supabase = await createSupabaseServerClient();

    if (id) {
        const { error } = await supabase
            .from("product_attribute_terms")
            .update(data)
            .eq("id", id);
        if (error) throw new Error(error.message);
        await logAdminActivity({ action: "UPDATE_ATTRIBUTE_TERM", resource: "product_attribute_terms", resourceId: id, metadata: { data } });
    } else {
        const { data: newTerm, error } = await supabase
            .from("product_attribute_terms")
            .insert(data)
            .select()
            .single();
        if (error) throw new Error(error.message);
        await logAdminActivity({ action: "CREATE_ATTRIBUTE_TERM", resource: "product_attribute_terms", resourceId: newTerm.id, metadata: { data } });
        return newTerm;
    }
}

export async function deleteAttributeTerm(id: string) {
    await ensureAdmin("manager");
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
        .from("product_attribute_terms")
        .delete()
        .eq("id", id);

    if (error) throw new Error(error.message);
    await logAdminActivity({ action: "DELETE_ATTRIBUTE_TERM", resource: "product_attribute_terms", resourceId: id });
}

export async function getProductsAdmin(params: {
    page?: number;
    limit?: number;
    query?: string;
    status?: string;
    activeOnly?: boolean;
}) {
    await ensureAdmin("support");
    const supabase = await createSupabaseServerClient();

    const page = params.page || 1;
    const limit = params.limit || 50;
    const offset = (page - 1) * limit;

    let queryBuilder = supabase
        .from("products")
        .select("*", { count: "exact" });

    if (params.query) {
        queryBuilder = queryBuilder.or(`name.ilike.%${params.query}%,slug.ilike.%${params.query}%`);
    }

    if (params.status) {
        queryBuilder = queryBuilder.eq("status", params.status);
    }

    if (params.activeOnly !== undefined) {
        queryBuilder = queryBuilder.eq("is_active", params.activeOnly);
    }

    const { data, count, error } = await queryBuilder
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return {
        products: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
    };
}

export async function getProductFullAdmin(id: string) {
    await ensureAdmin("support");
    const supabase = await createSupabaseServerClient();

    // Parallel fetch for all related data
    const [
        productRes,
        pricingRes,
        variantsRes,
        specsRes,
        contentRes,
        addonsRes
    ] = await Promise.all([
        supabase.from("products").select("*").eq("id", id).single(),
        supabase.from("product_pricing").select("*").eq("product_id", id).maybeSingle(),
        supabase.from("product_variants").select("*").eq("product_id", id),
        supabase.from("product_specs").select("*").eq("product_id", id).maybeSingle(),
        supabase.from("product_content").select("*").eq("product_id", id).maybeSingle(),
        supabase.from("product_addons").select("*").eq("product_id", id)
    ]);

    if (productRes.error || !productRes.data) {
        throw new Error(productRes.error?.message || "Product not found");
    }

    // Remaining storefront refactoring:
    // - [x] Refactor `EnhancedProductEditor` to use Server Actions for all mutations
    // - [x] Complete refactoring of remaining storefront pages and components
    //     - [x] Create `validateCartAction` Server Action
    //     - [x] Refactor `CheckoutClient` to use `validateCartAction`
    //     - [x] Implement M-Pesa payment logic via Server Actions
    //     - [x] Audit and refactor remaining niche pages (Compare, Search, etc.)
    const product = productRes.data;
    const productPricing = pricingRes.data;
    const variants = variantsRes.data || [];

    // Aggregating pricing
    const legacyPricing = {
        cost_price: product.cost_price || 0,
        sell_price: product.sell_price || 0,
        compare_price: product.regular_price || 0,
        discount_percent: product.discount_percent || 0,
    };

    const pricing = (productPricing && (productPricing.sell_price > 0 || productPricing.cost_price > 0))
        ? productPricing
        : legacyPricing;

    // Grouping variants
    const variantGroups = {
        colors: [] as any[],
        sizes: [] as any[],
        tiers: [] as any[]
    };

    for (const v of variants) {
        if (v.options?.color) {
            variantGroups.colors.push(v);
        } else if (v.options?.storage || v.options?.size) {
            variantGroups.sizes.push(v);
        } else {
            variantGroups.tiers.push(v);
        }
    }

    return {
        product,
        pricing,
        variants: variantGroups,
        specs: specsRes.data,
        content: contentRes.data,
        addons: addonsRes.data || []
    };
}

/**
 * Deletes a single product. 
 */
export async function deleteProduct(id: string) {
    await ensureAdmin("manager");
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

    if (error) throw new Error(error.message);

    await logAdminActivity({
        action: "DELETE_PRODUCT",
        resource: "products",
        resourceId: id,
    });

    revalidatePath("/admin/products");
    return { success: true };
}

/**
 * Adds a new product relation (upsell/cross-sell).
 */
export async function addProductRelation(fromId: string, toId: string, type: string, strength: number = 1.0) {
    await ensureAdmin("editor");
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("product_relation")
        .insert({
            from_product_id: fromId,
            to_product_id: toId,
            relation_type: type,
            strength: strength,
        })
        .select("*, to_product:products!to_product_id(id, name, thumbnail_url, slug)")
        .single();

    if (error) throw new Error(error.message);

    await logAdminActivity({
        action: "ADD_PRODUCT_RELATION",
        resource: "product_relation",
        resourceId: data.id,
        metadata: { fromId, toId, type },
    });

    revalidatePath(`/admin/products/${fromId}`);
    return { success: true, data };
}

/**
 * Deletes a product relation.
 */
export async function deleteProductRelation(id: string, fromId: string) {
    await ensureAdmin("editor");
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
        .from("product_relation")
        .delete()
        .eq("id", id);

    if (error) throw new Error(error.message);

    await logAdminActivity({
        action: "DELETE_PRODUCT_RELATION",
        resource: "product_relation",
        resourceId: id,
    });

    revalidatePath(`/admin/products/${fromId}`);
    return { success: true };
}

/**
 * Updates the strength of a product relation.
 */
export async function updateProductRelationStrength(id: string, fromId: string, strength: number) {
    await ensureAdmin("editor");
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
        .from("product_relation")
        .update({ strength, updated_at: new Date().toISOString() })
        .eq("id", id);

    if (error) throw new Error(error.message);

    await logAdminActivity({
        action: "UPDATE_PRODUCT_RELATION_STRENGTH",
        resource: "product_relation",
        resourceId: id,
        metadata: { strength },
    });

    revalidatePath(`/admin/products/${fromId}`);
    return { success: true };
}
