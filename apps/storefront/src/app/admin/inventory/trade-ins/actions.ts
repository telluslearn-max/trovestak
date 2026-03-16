"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { ensureAdmin } from "@/lib/admin/guard";
import { logAdminActivity } from "@/lib/admin/activity";

export async function createTradeInAction(formData: {
    device_name: string;
    device_brand?: string;
    device_model?: string;
    condition: "like_new" | "good" | "fair" | "poor";
    quoted_value?: number;
    customer_name?: string;
    customer_phone?: string;
    notes?: string;
}) {
    await ensureAdmin("editor");
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("trade_ins")
        .insert({
            device_name: formData.device_name,
            device_brand: formData.device_brand || null,
            device_model: formData.device_model || null,
            condition: formData.condition,
            quoted_value: formData.quoted_value || null,
            customer_name: formData.customer_name || null,
            customer_phone: formData.customer_phone || null,
            notes: formData.notes || null,
            status: "pending",
        })
        .select()
        .single();

    if (error) throw new Error(error.message);

    await logAdminActivity({
        action: "CREATE_PRODUCT",
        resource: "trade_ins",
        resourceId: data.id,
        metadata: { device: formData.device_name },
    });

    revalidatePath("/admin/inventory/trade-ins");
    return { success: true, data };
}

export async function updateTradeInStatusAction(id: string, status: string, finalValue?: number) {
    await ensureAdmin("editor");
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
        .from("trade_ins")
        .update({ status, final_value: finalValue ?? null, updated_at: new Date().toISOString() })
        .eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/admin/inventory/trade-ins");
}

export async function deleteTradeInAction(id: string) {
    await ensureAdmin("manager");
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.from("trade_ins").delete().eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/inventory/trade-ins");
}
