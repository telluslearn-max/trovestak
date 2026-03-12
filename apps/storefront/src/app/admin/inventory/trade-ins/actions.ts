"use server";

import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { ensureAdmin } from "@/lib/admin/guard";
import { logAdminActivity } from "@/lib/admin/activity";

/**
 * Records a new trade-in intake session.
 */
export async function createTradeInAction(formData: any) {
    try {
        await ensureAdmin("editor");
        const admin = createSupabaseAdminClient();

        console.log("[Admin Trade-in] Creating new intake session:", formData.product_name);

        const { data, error } = await admin
            .from("trade_ins")
            .insert([{
                ...formData,
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        await logAdminActivity({
            action: "CREATE_TRADE_IN",
            resource: "trade_ins",
            resourceId: data.id,
            metadata: { product: formData.product_name, valuation: formData.valuation_kes },
        });

        revalidatePath("/admin/inventory/trade-ins");
        return { success: true, data };
    } catch (err: any) {
        console.error("Create Trade-in Failed:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Deletes a trade-in record.
 */
export async function deleteTradeInAction(id: string) {
    try {
        await ensureAdmin("manager");
        const admin = createSupabaseAdminClient();

        const { error } = await admin
            .from("trade_ins")
            .delete()
            .eq("id", id);

        if (error) throw error;

        await logAdminActivity({
            action: "DELETE_TRADE_IN",
            resource: "trade_ins",
            resourceId: id,
        });

        revalidatePath("/admin/inventory/trade-ins");
        return { success: true };
    } catch (err: any) {
        console.error("Delete Trade-in Failed:", err);
        return { success: false, error: err.message };
    }
}
