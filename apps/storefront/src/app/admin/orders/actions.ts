"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { ensureAdmin } from "@/lib/admin/guard";
import { logAdminActivity } from "@/lib/admin/activity";

export async function getOrders() {
    await ensureAdmin("support");
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("orders")
        .select(`
            *,
            profiles:user_id (full_name, email)
        `)
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
}

export async function updateOrderStatus(id: string, status: string) {
    await ensureAdmin("editor");
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id);

    if (error) throw new Error(error.message);

    await logAdminActivity({
        action: "UPDATE_ORDER_STATUS",
        resource: "orders",
        resourceId: id,
        metadata: { status },
    });

    revalidatePath("/admin/orders");
}

