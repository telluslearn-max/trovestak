"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { ensureAdmin } from "@/lib/admin/guard";
import { logAdminActivity } from "@/lib/admin/activity";

export async function updateStockAction(variantId: string, changeAmount: number, reason: string) {
    await ensureAdmin("manager");
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Get current stock
    const { data: variant, error: fetchError } = await supabase
        .from("product_variants")
        .select("stock_quantity")
        .eq("id", variantId)
        .single();

    if (fetchError || !variant) {
        throw new Error("Variant not found");
    }

    const newStock = Math.max(0, variant.stock_quantity + changeAmount);

    // 2. Update Variant
    const { error: updateError } = await supabase
        .from("product_variants")
        .update({ stock_quantity: newStock })
        .eq("id", variantId);

    if (updateError) {
        throw new Error("Failed to update stock");
    }

    // 3. Log the change to dedicated stock log
    await supabase
        .from("stock_log")
        .insert({
            variant_id: variantId,
            change_amount: changeAmount,
            reason: reason,
            user_id: user?.id
        });

    // 4. Log to admin activity log
    await logAdminActivity({
        action: "UPDATE_STOCK",
        resource: "product_variants",
        resourceId: variantId,
        metadata: { change: changeAmount, reason, newStock },
    });

    revalidatePath("/admin/products");
    return { success: true, newStock };
}

export async function getProductVariantsAction(productId: string) {
    await ensureAdmin("support");
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("product_variants")
        .select(`
            id,
            name,
            sku,
            stock_quantity,
            options,
            price_kes
        `)
        .eq("product_id", productId);

    if (error) throw new Error(error.message);
    return { success: true, variants: data };
}
