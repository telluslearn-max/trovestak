"use server";

import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function trackOrderAction(orderId: string, email: string) {
    // Basic validation
    if (!orderId || !email) {
        return { success: false, error: "Order ID and Email are required" };
    }

    // Use admin client to lookup by ID and Email
    const supabase = getSupabaseAdmin();

    const { data: order, error } = await supabase
        .from("orders")
        .select(`
            id,
            status,
            payment_status,
            created_at,
            total_amount,
            customer_name,
            shipping_address,
            order_items (
                quantity,
                unit_price,
                product_id,
                variant_id
            )
        `)
        .eq("id", orderId)
        .eq("customer_email", email.toLowerCase().trim())
        .single();

    if (error || !order) {
        console.error("Tracking lookup failed:", error);
        return { success: false, error: "Order not found. Please check your credentials." };
    }

    return { success: true, order };
}
