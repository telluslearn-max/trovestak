"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { logAdminActivity } from "@/lib/admin/activity";

export type BundleType = "fixed" | "configurable";
export type BundleStatus = "draft" | "active" | "archived";

export async function getBundles() {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("bundles")
        .select(`
      *,
      bundle_items (
        id,
        quantity,
        product_variant_id,
        product_variants (
          id,
          name,
          sku,
          price_kes,
          stock_quantity,
          products (id, name, thumbnail_url)
        )
      ),
      bundle_slots (
        id,
        slot_name,
        required,
        sort_order,
        bundle_slot_options (
          id,
          price_modifier,
          product_variant_id,
          product_variants (
            id,
            name,
            sku,
            price_kes,
            stock_quantity,
            products (id, name, thumbnail_url)
          )
        )
      )
    `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching bundles:", error);
        return [];
    }
    return data;
}

export async function createBundle(data: {
    name: string;
    slug: string;
    description?: string;
    bundle_type: BundleType;
    status?: BundleStatus;
    price_override?: number;
    discount_type?: string;
    discount_value?: number;
}) {
    const supabase = await createSupabaseServerClient();
    const { data: bundle, error } = await supabase
        .from("bundles")
        .insert([data])
        .select()
        .single();

    if (error) throw new Error(error.message);

    await logAdminActivity({
        action: "CREATE_BUNDLE",
        resource: "bundles",
        resourceId: bundle.id,
        metadata: { name: bundle.name, type: bundle.bundle_type },
    });

    revalidatePath("/admin/bundles");
    return bundle;
}

export async function updateBundle(id: string, data: Partial<{
    name: string;
    slug: string;
    description: string;
    status: BundleStatus;
    price_override: number;
    discount_type: string;
    discount_value: number;
}>) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
        .from("bundles")
        .update(data)
        .eq("id", id);

    if (error) throw new Error(error.message);

    await logAdminActivity({
        action: "UPDATE_BUNDLE",
        resource: "bundles",
        resourceId: id,
        metadata: data,
    });

    revalidatePath("/admin/bundles");
}

export async function deleteBundle(id: string) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
        .from("bundles")
        .delete()
        .eq("id", id);

    if (error) throw new Error(error.message);

    await logAdminActivity({
        action: "DELETE_BUNDLE",
        resource: "bundles",
        resourceId: id,
    });

    revalidatePath("/admin/bundles");
}

/* Bundle Items (Fixed) */

export async function addBundleItem(bundleId: string, variantId: string, quantity: number = 1) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
        .from("bundle_items")
        .insert([{ bundle_id: bundleId, product_variant_id: variantId, quantity }]);

    if (error) throw new Error(error.message);
    revalidatePath("/admin/bundles");
}

export async function removeBundleItem(itemId: string) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
        .from("bundle_items")
        .delete()
        .eq("id", itemId);

    if (error) throw new Error(error.message);
    revalidatePath("/admin/bundles");
}

/* Bundle Slots (Configurable) */

export async function addBundleSlot(bundleId: string, slotName: string, required: boolean = true) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("bundle_slots")
        .insert([{ bundle_id: bundleId, slot_name: slotName, required }])
        .select()
        .single();

    if (error) throw new Error(error.message);
    revalidatePath("/admin/bundles");
    return data;
}

export async function deleteBundleSlot(slotId: string) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
        .from("bundle_slots")
        .delete()
        .eq("id", slotId);

    if (error) throw new Error(error.message);
    revalidatePath("/admin/bundles");
}

export async function addSlotOption(slotId: string, variantId: string, priceModifier: number = 0) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
        .from("bundle_slot_options")
        .insert([{ slot_id: slotId, product_variant_id: variantId, price_modifier: priceModifier }]);

    if (error) throw new Error(error.message);
    revalidatePath("/admin/bundles");
}

export async function removeSlotOption(optionId: string) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
        .from("bundle_slot_options")
        .delete()
        .eq("id", optionId);

    if (error) throw new Error(error.message);
    revalidatePath("/admin/bundles");
}

export async function searchVariants(query: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("product_variants")
        .select(`
      id,
      name,
      sku,
      price_kes,
      stock_quantity,
      products (
        id,
        name,
        thumbnail_url
      )
    `)
        .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
        .limit(10);

    if (error) {
        console.error("Error searching variants:", error);
        return [];
    }
    return data;
}

export async function getBundlesForProduct(productId: string) {
    const supabase = await createSupabaseServerClient();

    // 1. Get variants for this product
    const { data: variants } = await supabase
        .from("product_variants")
        .select("id")
        .eq("product_id", productId);

    if (!variants || variants.length === 0) return [];
    const variantIds = variants.map(v => v.id);

    // 2. Find fixed bundles containing these variants
    const { data: fixedItems } = await supabase
        .from("bundle_items")
        .select("bundle_id, bundles(*)")
        .in("product_variant_id", variantIds);

    // 3. Find configurable kits containing these variants
    const { data: slotOptions } = await supabase
        .from("bundle_slot_options")
        .select("slot_id, bundle_slots(bundle_id, bundles(*))")
        .in("product_variant_id", variantIds);

    // Combine and de-duplicate
    const bundlesMap = new Map<string, any>();

    fixedItems?.forEach(item => {
        if (item.bundles) bundlesMap.set(item.bundle_id, item.bundles);
    });

    slotOptions?.forEach(opt => {
        const bundle = (opt.bundle_slots as any)?.bundles;
        if (bundle) bundlesMap.set(bundle.id, bundle);
    });

    return Array.from(bundlesMap.values());
}
