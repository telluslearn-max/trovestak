"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { ensureAdmin } from "@/lib/admin/guard";
import { logAdminActivity } from "@/lib/admin/activity";
import { publishEvent, TOPICS, createEvent } from "@trovestak/shared";

export interface FulfillmentOrder {
    id: string;
    customer_name: string | null;
    customer_email: string | null;
    customer_phone: string | null;
    status: string;
    payment_status: string;
    payment_method: string | null;
    shipping_address: Record<string, string> | null;
    total_amount: number;
    rider_name: string | null;
    dispatched_at: string | null;
    created_at: string;
    items: FulfillmentOrderItem[];
}

export interface FulfillmentOrderItem {
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product_name: string | null;
    variant_label: string | null;
}

export interface Rider {
    id: string;
    name: string;
    phone: string;
    zone: string | null;
    is_active: boolean;
}

export async function getFulfillmentQueue(): Promise<FulfillmentOrder[]> {
    await ensureAdmin("support");
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("orders")
        .select(`
            id, customer_name, customer_phone, status, payment_status,
            payment_method, shipping_address, total_amount,
            rider_name, dispatched_at, created_at,
            profiles:user_id ( full_name, email )
        `)
        .eq("payment_status", "paid")
        .in("status", ["processing", "packing"])
        .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    const orders = (data || []) as any[];

    // Fetch items for each order
    const orderIds = orders.map(o => o.id);
    if (orderIds.length === 0) return [];

    const { data: itemsData } = await supabase
        .from("order_items")
        .select(`
            id, order_id, quantity, unit_price, total_price,
            product_variants:variant_id ( sku, color, storage,
                products:product_id ( name )
            )
        `)
        .in("order_id", orderIds);

    const itemsByOrder: Record<string, FulfillmentOrderItem[]> = {};
    for (const item of (itemsData || []) as any[]) {
        const variant = item.product_variants;
        const label = [variant?.color, variant?.storage].filter(Boolean).join(" / ");
        const entry: FulfillmentOrderItem = {
            id: item.id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            product_name: variant?.products?.name ?? null,
            variant_label: label || null,
        };
        if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
        itemsByOrder[item.order_id].push(entry);
    }

    return orders.map(o => ({
        id: o.id,
        customer_name: o.customer_name || (o.profiles as any)?.full_name || null,
        customer_email: (o.profiles as any)?.email || null,
        customer_phone: o.customer_phone || null,
        status: o.status,
        payment_status: o.payment_status,
        payment_method: o.payment_method,
        shipping_address: o.shipping_address,
        total_amount: o.total_amount,
        rider_name: o.rider_name,
        dispatched_at: o.dispatched_at,
        created_at: o.created_at,
        items: itemsByOrder[o.id] || [],
    }));
}

export async function assignRiderAction(orderId: string, riderName: string) {
    await ensureAdmin("editor");
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
        .from("orders")
        .update({ rider_name: riderName, status: "packing" })
        .eq("id", orderId);

    if (error) throw new Error(error.message);

    await logAdminActivity({
        action: "ASSIGN_RIDER",
        resource: "orders",
        resourceId: orderId,
        metadata: { rider_name: riderName },
    });

    revalidatePath("/admin/orders/fulfillment");
}

export async function markDispatchedAction(orderId: string) {
    await ensureAdmin("editor");
    const supabase = await createSupabaseServerClient();

    const dispatchedAt = new Date().toISOString();

    const { data: order, error } = await supabase
        .from("orders")
        .update({
            status: "shipped",
            dispatched_at: dispatchedAt,
        })
        .eq("id", orderId)
        .select("id, customer_name, customer_phone, rider_name, total_amount, shipping_address")
        .single();

    if (error) throw new Error(error.message);

    await logAdminActivity({
        action: "MARK_DISPATCHED",
        resource: "orders",
        resourceId: orderId,
        metadata: { dispatched_at: dispatchedAt },
    });

    // Publish ORDER_DISPATCHED event for notif-service (SMS to customer)
    try {
        await publishEvent(
            TOPICS.ORDER_DISPATCHED,
            createEvent(TOPICS.ORDER_DISPATCHED, "admin-fulfillment", {
                order_id: orderId,
                customer_name: order?.customer_name ?? null,
                customer_phone: order?.customer_phone ?? null,
                rider_name: order?.rider_name ?? null,
                total_amount: order?.total_amount ?? 0,
                shipping_address: order?.shipping_address ?? null,
                dispatched_at: dispatchedAt,
            })
        );
    } catch (pubsubErr) {
        // Non-fatal: log but don't fail the dispatch action
        console.error("Failed to publish ORDER_DISPATCHED event:", pubsubErr);
    }

    revalidatePath("/admin/orders/fulfillment");
}

export async function getRidersAction(): Promise<Rider[]> {
    await ensureAdmin("support");
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("riders")
        .select("id, name, phone, zone, is_active")
        .eq("is_active", true)
        .order("name");

    if (error) throw new Error(error.message);
    return (data || []) as Rider[];
}

export async function getPrintDataAction(orderIds: string[]) {
    await ensureAdmin("support");
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("orders")
        .select(`
            id, customer_name, customer_phone, total_amount,
            shipping_address, rider_name, created_at,
            profiles:user_id ( full_name, email ),
            order_items (
                quantity, unit_price, total_price,
                product_variants:variant_id ( sku, color, storage,
                    products:product_id ( name )
                )
            )
        `)
        .in("id", orderIds);

    if (error) throw new Error(error.message);
    return data || [];
}
