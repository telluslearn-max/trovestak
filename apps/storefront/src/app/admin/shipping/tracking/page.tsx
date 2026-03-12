import { createSupabaseServerClient } from "@/lib/supabase-server";
import ShippingTrackingClient from "./shipping-tracking-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Global Tracking | Trovestak Admin",
    description: "Real-time shipment monitoring.",
};

export default async function AdminShippingTrackingPage() {
    const supabase = await createSupabaseServerClient();

    const { data: orders, error } = await supabase
        .from("orders")
        .select("id, customer_name, status, shipping_tracking_id, created_at, shipping_address")
        .in("status", ["processing", "shipped", "pending"])
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) {
        console.error("Error fetching orders for shipping tracking:", error);
    }

    const rows = orders || [];
    const stats = {
        inTransit: rows.filter((o: any) => o.status === "shipped").length,
        pending: rows.filter((o: any) => o.status === "processing").length,
        delivered: 0,
    };

    return (
        <ShippingTrackingClient initialOrders={rows} stats={stats} />
    );
}
