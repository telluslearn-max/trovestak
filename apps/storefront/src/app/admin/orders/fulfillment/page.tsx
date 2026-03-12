import { createSupabaseServerClient } from "@/lib/supabase-server";
import FulfillmentClient from "./fulfillment-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Order Fulfillment | Trovestak Admin",
    description: "Order pipeline from procurement to delivery.",
};

export default async function AdminFulfillmentPage() {
    const supabase = await createSupabaseServerClient();

    // Fetch all non-delivered, non-cancelled orders for fulfillment pipeline
    const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .in("status", ["pending", "processing", "packing", "shipped"])
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching orders for fulfillment:", error);
    }

    return (
        <FulfillmentClient initialOrders={orders || []} />
    );
}
